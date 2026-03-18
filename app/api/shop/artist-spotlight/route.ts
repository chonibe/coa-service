import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getArtistImageByHandle, getCollectionDescription, getCollectionInstagram } from '@/lib/shopify/artist-image'
import { getCollectionProductHandlesByHandle, getCollectionGifUrlByAdmin, resolveMediaGidToUrl } from '@/lib/shopify/admin-collection-products'
import { getCollection, getCollectionWithListProducts, getProducts, getProductsByVendor, getProductsByHandles, type ShopifyProduct } from '@/lib/shopify/storefront-client'

/**
 * Artist Spotlight API
 *
 * Returns the "artist spotlight" for the experience: default is derived from the
 * latest 2 artworks added to Season 2 (2025-edition). Also supports ?artist= for
 * direct/affiliate links. Used for the experience selector banner: filter artworks,
 * "New Drop" badge, artist info card.
 */

const SEASON_2_HANDLE = '2025-edition'

export async function GET(request: Request) {
  try {
    const supabase = createClient()

    // When ?artist= is provided (e.g. from affiliate link), use that artist as spotlight first
    const { searchParams } = new URL(request.url)
    const requestedArtist = searchParams.get('artist')?.trim() || searchParams.get('vendor')?.trim()
    const forceUnlisted = ['1', 'true', 'yes'].includes((searchParams.get('unlisted') ?? '').toLowerCase())
    if (requestedArtist) {
      // Try collection by exact handle, then common variants (e.g. kymo → kymo-one). Allow Admin/COA fallback for early-access.
      const handlesToTry = [requestedArtist, `${requestedArtist}-one`]
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

    // 0. Default: Try Tyler Shelton first, then spotlight = artist of the latest 2 artworks in Season 2
    const tylerSheltonResult = await tryTylerSheltonSpotlight(supabase)
    if (tylerSheltonResult && !tylerSheltonResult.unlisted) return NextResponse.json(tylerSheltonResult)
    
    const season2Result = await trySeason2LatestSpotlight(supabase)
    if (season2Result && !season2Result.unlisted) return NextResponse.json(season2Result)

    // 1. Try Shopify: most recently created/activated product (Storefront returns published only); skip if unlisted
    const shopifyResult = await tryShopifySpotlight(supabase)
    if (shopifyResult && !shopifyResult.unlisted) return NextResponse.json(shopifyResult)

    // 2. Fallback: Supabase artwork_series_members (most recently added to series); skip if unlisted
    const supabaseResult = await trySupabaseSpotlight(supabase)
    if (supabaseResult && !supabaseResult.unlisted) return NextResponse.json(supabaseResult)

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
      first: 4,
      sortKey: 'CREATED_AT',
      reverse: true,
    })
    // Shopify vendor is often title-case; try slug as title-case if no products
    if ((!vendorProducts || vendorProducts.length === 0) && vendorNameOrSlug.includes('-')) {
      vendorName = slugToVendorName(vendorNameOrSlug)
      const next = await getProductsByVendor(vendorName, { first: 4, sortKey: 'CREATED_AT', reverse: true })
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
  options?: { allowEarlyAccessFallback?: boolean }
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
    const artistImage = image || imageFromCol || (await getArtistImageByHandle(handle))
    const collectionBio = bio || bioFromCol || (!bio && !bioFromCol ? await getCollectionDescription(handle) : undefined)
    const collectionInstagram = instagram || instagramFromCol || (!instagram && !instagramFromCol ? await getCollectionInstagram(handle) : undefined)

    const imageUrl = image || imageFromCol || artistImage
      || (newest?.featuredImage?.url) || newest?.images?.edges?.[0]?.node?.url

    return {
      vendorName,
      vendorSlug: handle,
      bio: bio || bioFromCol || collectionBio,
      instagram: instagram || instagramFromCol || collectionInstagram,
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

/** Build spotlight for Tyler Shelton by querying Supabase first, then Shopify. */
async function tryTylerSheltonSpotlight(supabase: ReturnType<typeof createClient>): Promise<SpotlightResult | null> {
  try {
    // First, try to find Tyler Shelton in Supabase vendors table (case-insensitive, flexible matching)
    const vendorNamesToTry = ['Tyler Shelton', 'tyler shelton', 'TylerShelton', 'tylershelton']
    let vendorId: number | null = null
    let vendorName: string | null = null
    
    for (const name of vendorNamesToTry) {
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id, vendor_name')
        .ilike('vendor_name', `%${name.replace(/\s+/g, '%')}%`)
        .maybeSingle()
      if (vendor) {
        vendorId = vendor.id
        vendorName = vendor.vendor_name
        break
      }
    }
    
    // If not found by name, try vendor_collections by handle
    if (!vendorId) {
      const handlesToTry = ['tyler-shelton', 'tyler-shelton-one', 'tylershelton']
      for (const handle of handlesToTry) {
        const { data: vc } = await supabase
          .from('vendor_collections')
          .select('vendor_id, vendor_name')
          .eq('shopify_collection_handle', handle)
          .maybeSingle()
        if (vc?.vendor_id) {
          vendorId = vc.vendor_id
          vendorName = vc.vendor_name
          break
        }
      }
    }
    
    // If still not found, try direct Shopify vendor lookup (vendor might exist in Shopify but not Supabase yet)
    if (!vendorId || !vendorName) {
      const shopifyVendorNames = ['Tyler Shelton', 'TylerShelton']
      for (const shopifyName of shopifyVendorNames) {
        const { products } = await getProductsByVendor(shopifyName, { first: 1 })
        if (products && products.length > 0 && products[0].vendor) {
          vendorName = products[0].vendor
          break
        }
      }
    }
    
    if (!vendorName) return null
    
    // Get vendor meta data (vendorId might be null if found via Shopify only)
    const { bio, image, vendorSlug, instagram, gifUrl, unlisted } = await getVendorMeta(supabase, vendorName, vendorId)
    
    // Try to get products by vendor name
    const handle = vendorSlug || slugify(vendorName)
    
    // First try collection spotlight (might have products)
    const colResult = await tryCollectionSpotlight(supabase, handle)
    if (colResult && colResult.productIds.length > 0) {
      return colResult
    }
    
    // Try vendor products
    const { products: vendorProducts } = await getProductsByVendor(vendorName, {
      first: 4,
      sortKey: 'CREATED_AT',
      reverse: true,
    })
    
    const filtered = (vendorProducts || []).filter(
      (p) => p.handle !== 'street_lamp' && !p.handle?.startsWith('street-lamp')
    )
    
    const productIds = filtered
      .slice(0, 4)
      .map((p) => p.id.replace(/^gid:\/\/shopify\/Product\//i, '') || p.id)
      .filter(Boolean)
    
    const newest = filtered[0]
    const artistImage = image ||
      (await getArtistImageByHandle(handle)) ||
      (await getArtistImageByHandle(`${handle}-one`)) ||
      newest?.featuredImage?.url ||
      newest?.images?.edges?.[0]?.node?.url ||
      colResult?.image
    
    const collectionBio = !bio ? await getCollectionDescription(handle) || await getCollectionDescription(`${handle}-one`) : undefined
    const collectionInstagram = !instagram ? await getCollectionInstagram(handle) || await getCollectionInstagram(`${handle}-one`) : undefined
    
    // Return spotlight even if no products found (vendor exists in database)
    return {
      vendorName,
      vendorSlug: handle,
      bio: bio || colResult?.bio || collectionBio,
      instagram: instagram || colResult?.instagram || collectionInstagram,
      image: artistImage || undefined,
      productIds: productIds.length > 0 ? productIds : (colResult?.productIds || []),
      seriesName: colResult?.seriesName,
      gifUrl: gifUrl || colResult?.gifUrl,
      unlisted: unlisted || colResult?.unlisted || false,
    }
  } catch {
    return null
  }
}

/** Build spotlight from the latest 2 artworks in Season 2 (2025-edition). */
async function trySeason2LatestSpotlight(supabase: ReturnType<typeof createClient>): Promise<SpotlightResult | null> {
  try {
    const col = await getCollectionWithListProducts(SEASON_2_HANDLE, {
      first: 2,
      sortKey: 'CREATED',
      reverse: true,
    })
    if (!col) return null

    const nodes = (col.products?.edges?.map((e) => e.node) ?? []).filter(
      (p) => p.handle !== 'street_lamp' && !p.handle?.startsWith('street-lamp')
    )
    if (nodes.length === 0) return null

    const vendorName = nodes[0].vendor || col.title || SEASON_2_HANDLE.replace(/-/g, ' ')
    const productIds = nodes
      .map((p) => p.id.replace(/^gid:\/\/shopify\/Product\//i, '') || p.id)
      .filter(Boolean)
    const newest = nodes[0]

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
    }
  } catch {
    return null
  }
}

async function tryShopifySpotlight(supabase: ReturnType<typeof createClient>) {
  try {
    // Storefront API returns published products only; CREATED_AT desc = most recently activated
    const { products } = await getProducts({
      first: 5,
      sortKey: 'CREATED_AT',
      reverse: true,
    })
    // Skip lamp and non-artwork products; find first product with a vendor (artist)
    const newest = (products || []).find(
      (p) => p.vendor && p.handle !== 'street_lamp' && !p.handle?.startsWith('street-lamp')
    )
    if (!newest?.vendor) return null

    const vendorName = newest.vendor
    const numericId = newest.id.replace(/^gid:\/\/shopify\/Product\//i, '') || newest.id

    // Get recent products from same vendor (the "new drop") — max 4 items per drop
    const { products: vendorProducts } = await getProductsByVendor(vendorName, {
      first: 4,
      sortKey: 'CREATED_AT',
      reverse: true,
    })
    const productIds = (vendorProducts || [])
      .filter((p) => p.handle !== 'street_lamp' && !p.handle?.startsWith('street-lamp'))
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

  const productIds = members
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

  return {
    vendorName: series.vendor_name,
    vendorSlug: handle,
    bio,
    image: image || undefined,
    instagram,
    productIds,
    seriesName: series.name,
    gifUrl: meta.gifUrl,
    unlisted: meta.unlisted,
  }
}

async function getVendorMeta(
  supabase: ReturnType<typeof createClient>,
  vendorName: string,
  vendorId: number | null
): Promise<{ bio?: string; image?: string; vendorSlug?: string; instagram?: string; gifUrl?: string; unlisted?: boolean }> {
  let bio: string | undefined
  let image: string | undefined
  let vendorSlug: string | undefined
  let instagram: string | undefined
  let gifUrl: string | undefined
  let unlisted: boolean | undefined

  if (vendorId) {
    const { data: vendor } = await supabase
      .from('vendors')
      .select('bio, profile_image, profile_picture_url, instagram_url')
      .eq('id', vendorId)
      .maybeSingle()
    if (vendor?.bio?.trim()) bio = vendor.bio.trim()
    const v = vendor as { profile_picture_url?: string; profile_image?: string; instagram_url?: string } | null
    if (v?.profile_picture_url || v?.profile_image) {
      image = v.profile_picture_url || v.profile_image
    }
    if (v?.instagram_url?.trim()) instagram = parseInstagramHandle(v.instagram_url)
  } else {
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id, bio, profile_image, profile_picture_url, instagram_url')
      .ilike('vendor_name', vendorName)
      .maybeSingle()
    if (vendor?.bio?.trim()) bio = vendor.bio.trim()
    const v = vendor as { profile_picture_url?: string; profile_image?: string; instagram_url?: string } | null
    if (v?.profile_picture_url || v?.profile_image) {
      image = v.profile_picture_url || v.profile_image
    }
    if (v?.instagram_url?.trim()) instagram = parseInstagramHandle(v.instagram_url)
    if (vendor?.id) vendorId = (vendor as { id: number }).id
  }

  const vcQuery = vendorId
    ? supabase.from('vendor_collections').select('shopify_collection_handle').eq('vendor_id', vendorId)
    : supabase.from('vendor_collections').select('shopify_collection_handle').eq('vendor_name', vendorName)
  const { data: vc } = await vcQuery.maybeSingle()
  if (vc?.shopify_collection_handle) vendorSlug = vc.shopify_collection_handle

  // Fallback: fetch collection from Shopify for image, description, and instagram metafield
  if (vendorSlug) {
    try {
      const col = await getCollection(vendorSlug, { first: 1 })
      if (col) {
        if (!image) {
          image = col.image?.url ?? col.products?.edges?.[0]?.node?.featuredImage?.url
        }
        if (!bio) {
          const desc = col.description?.trim() || (col.descriptionHtml
            ? col.descriptionHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
            : '')
          if (desc) bio = desc
        }
        if (!instagram && col.metafield?.value?.trim()) {
          instagram = parseInstagramHandle(col.metafield.value)
        }
        if (col.gifMetafield?.value?.trim()) {
          gifUrl = col.gifMetafield.value.trim()
        }
        if (col.unlistedMetafield?.value?.trim()) {
          unlisted = true
        }
      }
    } catch {
      // Ignore
    }
  }

  return { bio, image, vendorSlug, instagram, gifUrl, unlisted }
}

/** Extract Instagram handle for display (@username) from URL or handle string */
function parseInstagramHandle(value: string): string {
  const trimmed = value.trim()
  const match = trimmed.match(/(?:instagram\.com\/|instagr\.am\/|@)([a-zA-Z0-9._]+)/i)
  if (match) return match[1]
  if (trimmed.startsWith('@')) return trimmed.slice(1)
  return trimmed
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
