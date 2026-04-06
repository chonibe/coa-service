import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getArtistImageByHandle, getCollectionDescription, getCollectionInstagram } from '@/lib/shopify/artist-image'
import { getVendorMeta, parseInstagramHandle } from '@/lib/shopify/vendor-meta'
import { getCollectionProductHandlesByHandle, getCollectionGifUrlByAdmin, resolveMediaGidToUrl } from '@/lib/shopify/admin-collection-products'
import { getCollectionWithListProducts, getProducts, getProductsByVendor, getProductsByHandles, type ShopifyProduct } from '@/lib/shopify/storefront-client'
import {
  buildVendorSpotlightEligibilityMap,
  firstEligibleProductIndex,
} from '@/lib/shop/artist-spotlight-vendor-eligibility'

/**
 * Artist Spotlight API
 *
 * Returns the "artist spotlight" for the experience: default is the newest **eligible**
 * artist in Season 2 (2025-edition), then the newest eligible Shopify product, then
 * Supabase series — then **Jack J.C. Art** only as a fallback when those paths do not
 * resolve. Vendors with `vendors.artist_spotlight_enabled = false` are skipped (admin).
 * `?artist=` affiliate links ignore the spotlight-enabled flag. Used for the experience
 * banner, filters, "New Drop" badge, and artist info card.
 */

const SEASON_2_HANDLE = '2025-edition'

function normalizeVendorForSpotlight(name: string | null | undefined): string {
  return (name ?? '').trim().toLowerCase().replace(/\s+/g, '_')
}

/** Season 2 / Shopify automatic picks skip rows with no vendor only. */
function shouldSkipDefaultSpotlightVendor(vendor: string | null | undefined): boolean {
  return !normalizeVendorForSpotlight(vendor)
}

export async function GET(request: Request) {
  try {
    const supabase = createClient()

    // When ?artist= is provided (e.g. from affiliate link), use that artist as spotlight first
    const { searchParams } = new URL(request.url)
    const requestedArtist = searchParams.get('artist')?.trim() || searchParams.get('vendor')?.trim()
    const forceUnlisted = ['1', 'true', 'yes'].includes((searchParams.get('unlisted') ?? '').toLowerCase())
    if (requestedArtist) {
      // Try collection by exact handle, then common variants (e.g. kymo → kymo-one, jack-jc-art → jack-j-c-art). Allow Admin/COA fallback for early-access.
      const jcVariant = requestedArtist.replace(/-jc-/, '-j-c-') // jack-jc-art → jack-j-c-art
      const handlesToTry = [requestedArtist, `${requestedArtist}-one`, ...(jcVariant !== requestedArtist ? [jcVariant, `${jcVariant}-one`] : [])]
      for (const h of handlesToTry) {
        const byCollection = await tryCollectionSpotlight(supabase, h, { allowEarlyAccessFallback: true })
        if (byCollection) {
          const payload = forceUnlisted ? { ...byCollection, unlisted: true } : byCollection
          return NextResponse.json(payload)
        }
      }
      const byVendor = await tryVendorSpotlight(supabase, requestedArtist)
      if (byVendor) {
        const payload = forceUnlisted ? { ...byVendor, unlisted: true } : byVendor
        return NextResponse.json(payload)
      }
    }

    // Default: newest in Season 2, then Shopify, then Supabase — Jack J.C. Art last (fallback only)
    const season2Result = await trySeason2LatestSpotlight(supabase)
    if (season2Result && !season2Result.unlisted) return NextResponse.json(season2Result)

    const shopifyResult = await tryShopifySpotlight(supabase)
    if (shopifyResult && !shopifyResult.unlisted) return NextResponse.json(shopifyResult)

    const supabaseResult = await trySupabaseSpotlight(supabase)
    if (supabaseResult && !supabaseResult.unlisted) return NextResponse.json(supabaseResult)

    const jackJcArtHandles = ['jack-jc-art', 'jack-j-c-art', 'jack-jc-art-one', 'jack-j-c-art-one']
    for (const h of jackJcArtHandles) {
      const jackResult = await tryCollectionSpotlight(supabase, h, {
        allowEarlyAccessFallback: false,
        requireDefaultSpotlightEligible: true,
      })
      if (jackResult && !jackResult.unlisted) return NextResponse.json(jackResult)
    }

    return NextResponse.json(null)
  } catch (error) {
    console.error('[artist-spotlight] Error:', error)
    return NextResponse.json(null)
  }
}

type SpotlightResult = {
  vendorName: string
  vendorSlug: string
  bio?: string
  instagram?: string
  image?: string
  productIds: string[]
  seriesName?: string
  /** URL from collection metafield custom.gif — when set, show GIF overlay on collapsed spotlight card */
  gifUrl?: string
  /** When true, collection is unlisted (only shown when requested via ?artist=; excluded from default spotlight) */
  unlisted?: boolean
  /** Product objects for preselection when ?artist= is present (enables lamp preview without season load) */
  products?: ShopifyProduct[]
}

/** Title-case a slug for Shopify vendor name (e.g. kymo → Kymo) */
function slugToVendorName(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

/** Build spotlight from products by vendor name (or slug; will try title-case if needed) */
async function tryVendorSpotlight(supabase: ReturnType<typeof createClient>, vendorNameOrSlug: string): Promise<SpotlightResult | null> {
  try {
    let vendorName = vendorNameOrSlug
    let { products: vendorProducts } = await getProductsByVendor(vendorNameOrSlug, {
      first: 12,
      sortKey: 'CREATED_AT',
      reverse: true,
    })
    // Shopify vendor is often title-case; try slug as title-case if no products
    if ((!vendorProducts || vendorProducts.length === 0) && vendorNameOrSlug.includes('-')) {
      vendorName = slugToVendorName(vendorNameOrSlug)
      const next = await getProductsByVendor(vendorName, { first: 12, sortKey: 'CREATED_AT', reverse: true })
      vendorProducts = next?.products ?? []
    } else if (vendorProducts?.length) {
      vendorName = vendorProducts[0].vendor || vendorNameOrSlug
    }
    const filtered = (vendorProducts || []).filter(
      (p) => p.handle !== 'street_lamp' && !p.handle?.startsWith('street-lamp')
    )
    if (filtered.length === 0) return null

    const productIds = filtered
      .slice(0, 4)
      .map((p) => p.id.replace(/^gid:\/\/shopify\/Product\//i, '') || p.id)
      .filter(Boolean)
    const newest = filtered[0]

    const { bio, image, vendorSlug, instagram, gifUrl, unlisted } = await getVendorMeta(supabase, vendorName, null)
    const handle = vendorSlug || slugify(vendorName)
    // Try handle and handle-one so we get collection image/description when handle is e.g. kymo-one
    const artistImage = image ||
      (await getArtistImageByHandle(handle)) ||
      (handle !== `${vendorNameOrSlug}-one` ? await getArtistImageByHandle(`${vendorNameOrSlug}-one`) : undefined)
    const collectionBio = !bio ? await getCollectionDescription(handle) || await getCollectionDescription(`${vendorNameOrSlug}-one`) : undefined
    const collectionInstagram = !instagram ? await getCollectionInstagram(handle) || await getCollectionInstagram(`${vendorNameOrSlug}-one`) : undefined

    return {
      vendorName,
      vendorSlug: handle,
      bio: bio || collectionBio,
      instagram: instagram || collectionInstagram,
      image: artistImage || newest.featuredImage?.url || newest.images?.edges?.[0]?.node?.url,
      productIds: productIds.length > 0 ? productIds : [newest.id.replace(/^gid:\/\/shopify\/Product\//i, '') || newest.id],
      seriesName: undefined,
      gifUrl,
      unlisted,
      products: filtered.slice(0, 4),
    }
  } catch {
    return null
  }
}

/** Build spotlight from collection by handle (when vendor name doesn't match).
 * When allowEarlyAccessFallback is false (default experience), only use Storefront products — no Admin/COA fallback.
 * When true (?artist= early-access link), fetch via Admin + Storefront so COA-only products appear. */
async function tryCollectionSpotlight(
  supabase: ReturnType<typeof createClient>,
  collectionHandle: string,
  options?: { allowEarlyAccessFallback?: boolean; requireDefaultSpotlightEligible?: boolean }
): Promise<SpotlightResult | null> {
  try {
    const col = await getCollectionWithListProducts(collectionHandle, { first: 8 })
    if (!col) return null

    let nodes = (col.products?.edges?.map((e) => e.node) ?? []).filter(
      (p) => p.handle !== 'street_lamp' && !p.handle?.startsWith('street-lamp')
    )
    if (nodes.length === 0 && options?.allowEarlyAccessFallback) {
      let handles: string[] = []
      if (col.productHandlesMetafield?.value?.trim()) {
        handles = col.productHandlesMetafield.value.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
      }
      if (handles.length === 0 && col.handle) {
        handles = await getCollectionProductHandlesByHandle(col.handle)
      }
      if (handles.length > 0) {
        const byHandles = await getProductsByHandles(handles, { preferPrivateToken: true })
        nodes = byHandles.filter((p) => p.handle !== 'street_lamp' && !p.handle?.startsWith('street-lamp'))
      }
    }
    if (nodes.length === 0) return null

    const vendorName = (nodes[0]?.vendor) || col.title || collectionHandle.replace(/-/g, ' ')

    if (options?.requireDefaultSpotlightEligible) {
      const elig = await buildVendorSpotlightEligibilityMap(supabase, [vendorName])
      if (elig.get(vendorName) === false) return null
    }

    const productIds = nodes
      .slice(0, 4)
      .map((p) => p.id.replace(/^gid:\/\/shopify\/Product\//i, '') || p.id)
      .filter(Boolean)
    const newest = nodes[0]

    // Prefer collection's own image, description, and Instagram (we already have col)
    const imageFromCol = col.image?.url
    const bioFromCol = col.description?.trim() ||
      (col.descriptionHtml ? col.descriptionHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '')
    const instagramFromCol = col.metafield?.value?.trim() ? parseInstagramHandle(col.metafield.value) : undefined
    let gifUrl = col.gifMetafield?.value?.trim() || undefined
    if (!gifUrl && col.id) {
      const fromAdmin = await getCollectionGifUrlByAdmin(col.id)
      if (fromAdmin) gifUrl = fromAdmin
    }
    if (gifUrl?.startsWith('gid://')) {
      const resolved = await resolveMediaGidToUrl(gifUrl)
      if (resolved) gifUrl = resolved
    }
    const unlisted = Boolean(col.unlistedMetafield?.value?.trim())

    const { bio, image, vendorSlug, instagram } = await getVendorMeta(supabase, vendorName, null)
    const handle = vendorSlug || slugify(vendorName) || collectionHandle
    const artistImage = imageFromCol || image || (await getArtistImageByHandle(handle))
    const collectionBio = bioFromCol || bio || (!bioFromCol && !bio ? await getCollectionDescription(handle) : undefined)
    const collectionInstagram = instagramFromCol || instagram || (!instagramFromCol && !instagram ? await getCollectionInstagram(handle) : undefined)

    const imageUrl = imageFromCol || image || artistImage
      || (newest?.featuredImage?.url) || newest?.images?.edges?.[0]?.node?.url

    return {
      vendorName,
      vendorSlug: handle,
      bio: bioFromCol || bio || collectionBio,
      instagram: instagramFromCol || instagram || collectionInstagram,
      image: imageUrl || undefined,
      productIds: productIds.length > 0 ? productIds : (newest ? [newest.id.replace(/^gid:\/\/shopify\/Product\//i, '') || newest.id] : []),
      seriesName: col.title !== vendorName ? col.title : undefined,
      gifUrl,
      unlisted,
      products: nodes.slice(0, 4),
    }
  } catch {
    return null
  }
}

/** Build spotlight from the latest 2 artworks in Season 2 (2025-edition). */
async function trySeason2LatestSpotlight(supabase: ReturnType<typeof createClient>): Promise<SpotlightResult | null> {
  try {
    const col = await getCollectionWithListProducts(SEASON_2_HANDLE, {
      first: 8,
      sortKey: 'CREATED',
      reverse: true,
    })
    if (!col) return null

    const nodes = (col.products?.edges?.map((e) => e.node) ?? []).filter(
      (p) => p.handle !== 'street_lamp' && !p.handle?.startsWith('street-lamp')
    )
    if (nodes.length === 0) return null

    const vendorNamesOrdered = nodes.map((n) => n.vendor)
    const seasonElig = await buildVendorSpotlightEligibilityMap(
      supabase,
      vendorNamesOrdered.filter(Boolean) as string[]
    )
    const startIdx = firstEligibleProductIndex(vendorNamesOrdered, seasonElig, {
      skipVendor: (name) => shouldSkipDefaultSpotlightVendor(name),
    })
    if (startIdx < 0) return null

    const anchor = nodes[startIdx]
    if (!anchor?.vendor) return null

    const anchorKey = normalizeVendorForSpotlight(anchor.vendor)
    const vendorNodes = nodes.filter((p) => normalizeVendorForSpotlight(p.vendor) === anchorKey)
    if (vendorNodes.length === 0) return null

    const vendorName = anchor.vendor || col.title || SEASON_2_HANDLE.replace(/-/g, ' ')
    const productIds = vendorNodes
      .map((p) => p.id.replace(/^gid:\/\/shopify\/Product\//i, '') || p.id)
      .filter(Boolean)
    const newest = vendorNodes[0]

    const { bio, image, vendorSlug, instagram, gifUrl, unlisted } = await getVendorMeta(supabase, vendorName, null)
    const handle = vendorSlug || slugify(vendorName)
    const artistImage =
      image ||
      (await getArtistImageByHandle(handle)) ||
      (await getArtistImageByHandle(`${handle}-one`))
    const collectionBio = !bio ? await getCollectionDescription(handle) || await getCollectionDescription(`${handle}-one`) : undefined
    const collectionInstagram = !instagram ? await getCollectionInstagram(handle) || await getCollectionInstagram(`${handle}-one`) : undefined

    return {
      vendorName,
      vendorSlug: handle,
      bio: bio || collectionBio,
      instagram: instagram || collectionInstagram,
      image: artistImage || newest.featuredImage?.url || newest.images?.edges?.[0]?.node?.url,
      productIds: productIds.length > 0 ? productIds : [newest.id.replace(/^gid:\/\/shopify\/Product\//i, '') || newest.id],
      seriesName: col.title !== vendorName ? col.title : undefined,
      gifUrl,
      unlisted,
      /** So experience clients can resolve the featured bundle + merge into selector without relying on first collection page. */
      products: vendorNodes.slice(0, 4),
    }
  } catch {
    return null
  }
}

async function tryShopifySpotlight(supabase: ReturnType<typeof createClient>) {
  try {
    // Storefront API returns published products only; CREATED_AT desc = most recently activated
    const { products } = await getProducts({
      first: 20,
      sortKey: 'CREATED_AT',
      reverse: true,
    })
    const candidates = (products || []).filter(
      (p) =>
        p.vendor &&
        !shouldSkipDefaultSpotlightVendor(p.vendor) &&
        p.handle !== 'street_lamp' &&
        !p.handle?.startsWith('street-lamp')
    )
    const shopifyElig = await buildVendorSpotlightEligibilityMap(
      supabase,
      candidates.map((p) => p.vendor!)
    )
    const newest = candidates.find((p) => shopifyElig.get(p.vendor!) !== false)
    if (!newest?.vendor) return null

    const vendorName = newest.vendor
    const numericId = newest.id.replace(/^gid:\/\/shopify\/Product\//i, '') || newest.id

    // Get recent products from same vendor (the "new drop") — max 4 items per drop
    const { products: vendorProducts } = await getProductsByVendor(vendorName, {
      first: 12,
      sortKey: 'CREATED_AT',
      reverse: true,
    })
    const artworkNodes = (vendorProducts || []).filter(
      (p) => p.handle !== 'street_lamp' && !p.handle?.startsWith('street-lamp')
    )
    const productIds = artworkNodes
      .slice(0, 4)
      .map((p) => p.id.replace(/^gid:\/\/shopify\/Product\//i, '') || p.id)
      .filter(Boolean)

    // Get vendor bio/image/instagram from Supabase (vendor profile → collection → getArtistImageByHandle)
    const { bio, image, vendorSlug, instagram, gifUrl, unlisted } = await getVendorMeta(supabase, vendorName, null)
    const handle = vendorSlug || slugify(vendorName)
    const artistImage = image || (await getArtistImageByHandle(handle))
    const collectionBio = !bio ? await getCollectionDescription(handle) : undefined
    const collectionInstagram = !instagram ? await getCollectionInstagram(handle) : undefined

    return {
      vendorName,
      vendorSlug: handle,
      bio: bio || collectionBio,
      instagram: instagram || collectionInstagram,
      image: artistImage || newest.featuredImage?.url || newest.images?.edges?.[0]?.node?.url,
      productIds: productIds.length > 0 ? productIds : [numericId],
      seriesName: undefined,
      gifUrl,
      unlisted,
      products: artworkNodes.slice(0, 4),
    }
  } catch {
    return null
  }
}

async function trySupabaseSpotlight(supabase: ReturnType<typeof createClient>) {
  const { data: latestMember, error: memberError } = await supabase
    .from('artwork_series_members')
    .select('series_id, created_at')
    .not('shopify_product_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (memberError || !latestMember?.series_id) return null

  const { data: series, error: seriesError } = await supabase
    .from('artwork_series')
    .select('id, name, vendor_name, description, thumbnail_url, vendor_id')
    .eq('id', latestMember.series_id)
    .eq('is_active', true)
    .single()

  if (seriesError || !series) return null

  const seriesElig = await buildVendorSpotlightEligibilityMap(supabase, [series.vendor_name])
  if (seriesElig.get(series.vendor_name) === false) return null

  const { data: members, error: membersError } = await supabase
    .from('artwork_series_members')
    .select('shopify_product_id')
    .eq('series_id', series.id)
    .not('shopify_product_id', 'is', null)

  if (membersError || !members?.length) {
    const { bio: metaBio, image: metaImage, vendorSlug, instagram, gifUrl, unlisted } = await getVendorMeta(supabase, series.vendor_name, series.vendor_id)
    const handle = vendorSlug || slugify(series.vendor_name)
    const artistImage = metaImage || series.thumbnail_url || (await getArtistImageByHandle(handle))
    const collectionBio = !metaBio && !series.description?.trim() ? await getCollectionDescription(handle) : undefined
    return {
      vendorName: series.vendor_name,
      vendorSlug: handle,
      bio: metaBio || series.description?.trim() || collectionBio || undefined,
      instagram,
      image: artistImage || undefined,
      productIds: [],
      seriesName: series.name,
      gifUrl,
      unlisted,
    }
  }

  let productIds = members
    .map((m) => m.shopify_product_id?.trim())
    .filter(Boolean)
    .slice(0, 4) as string[]

  let bio = series.description?.trim() || undefined
  let image = series.thumbnail_url || undefined
  let instagram: string | undefined
  const meta = await getVendorMeta(supabase, series.vendor_name, series.vendor_id)
  if (meta.bio) bio = meta.bio
  if (meta.image) image = meta.image
  if (meta.instagram) instagram = meta.instagram
  const handle = meta.vendorSlug || slugify(series.vendor_name)
  if (!image) image = await getArtistImageByHandle(handle)
  if (!bio) bio = await getCollectionDescription(handle)

  /** Supabase IDs alone are often missing from the experience SSR product lists — attach Storefront nodes for bundle resolution. */
  let spotlightProducts: ShopifyProduct[] | undefined
  try {
    const { products: vendorProducts } = await getProductsByVendor(series.vendor_name, {
      first: 12,
      sortKey: 'CREATED_AT',
      reverse: true,
    })
    const artworkNodes = (vendorProducts || []).filter(
      (p) => p.handle !== 'street_lamp' && !p.handle?.startsWith('street-lamp')
    )
    if (artworkNodes.length >= 2) {
      spotlightProducts = artworkNodes.slice(0, 4)
      const vendorNumeric = artworkNodes.map(
        (p) => p.id.replace(/^gid:\/\/shopify\/Product\//i, '') || p.id
      )
      const merged: string[] = []
      const seen = new Set<string>()
      const push = (raw: string) => {
        const k = raw.replace(/^gid:\/\/shopify\/Product\//i, '') || raw
        if (!k || seen.has(k)) return
        seen.add(k)
        merged.push(k)
      }
      for (const id of productIds) push(id)
      for (const id of vendorNumeric) push(id)
      if (merged.length >= 2) productIds = merged.slice(0, 4)
    }
  } catch {
    // optional enrichment
  }

  return {
    vendorName: series.vendor_name,
    vendorSlug: handle,
    bio,
    image: image || undefined,
    instagram,
    productIds,
    products: spotlightProducts,
    seriesName: series.name,
    gifUrl: meta.gifUrl,
    unlisted: meta.unlisted,
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
