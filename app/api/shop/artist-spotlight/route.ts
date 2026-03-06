import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getArtistImageByHandle, getCollectionDescription, getCollectionInstagram } from '@/lib/shopify/artist-image'
import { getCollection, getCollectionWithListProducts, getProducts, getProductsByVendor } from '@/lib/shopify/storefront-client'

/**
 * Artist Spotlight API
 *
 * Returns the most recent "artist spotlight" — the vendor with the most recently
 * activated product. Tries override first (Tyler Shelton), then Shopify, then Supabase.
 * Used for the experience selector banner: filter artworks, "New Drop" badge, artist info card.
 */

/** Spotlight override: vendor name and/or collection handle to try */
const SPOTLIGHT_OVERRIDE = { vendorName: 'Tyler Shelton', collectionHandle: 'tyler-shelton' }

export async function GET() {
  try {
    const supabase = createClient()

    // 0. Override: try configured artist first (vendor name, then collection by handle)
    const overrideResult =
      (await tryVendorSpotlight(supabase, SPOTLIGHT_OVERRIDE.vendorName)) ??
      (await tryCollectionSpotlight(supabase, SPOTLIGHT_OVERRIDE.collectionHandle))
    if (overrideResult) return NextResponse.json(overrideResult)

    // 1. Try Shopify: most recently created/activated product (Storefront returns published only)
    const shopifyResult = await tryShopifySpotlight(supabase)
    if (shopifyResult) return NextResponse.json(shopifyResult)

    // 2. Fallback: Supabase artwork_series_members (most recently added to series)
    const supabaseResult = await trySupabaseSpotlight(supabase)
    if (supabaseResult) return NextResponse.json(supabaseResult)

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
}

/** Build spotlight from products by vendor name */
async function tryVendorSpotlight(supabase: ReturnType<typeof createClient>, vendorName: string): Promise<SpotlightResult | null> {
  try {
    const { products: vendorProducts } = await getProductsByVendor(vendorName, {
      first: 4,
      sortKey: 'CREATED_AT',
      reverse: true,
    })
    const filtered = (vendorProducts || []).filter(
      (p) => p.handle !== 'street_lamp' && !p.handle?.startsWith('street-lamp')
    )
    if (filtered.length === 0) return null

    const productIds = filtered
      .slice(0, 4)
      .map((p) => p.id.replace(/^gid:\/\/shopify\/Product\//i, '') || p.id)
      .filter(Boolean)
    const newest = filtered[0]

    const { bio, image, vendorSlug, instagram } = await getVendorMeta(supabase, vendorName, null)
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
      productIds: productIds.length > 0 ? productIds : [newest.id.replace(/^gid:\/\/shopify\/Product\//i, '') || newest.id],
      seriesName: undefined,
    }
  } catch {
    return null
  }
}

/** Build spotlight from collection by handle (when vendor name doesn't match) */
async function tryCollectionSpotlight(supabase: ReturnType<typeof createClient>, collectionHandle: string): Promise<SpotlightResult | null> {
  try {
    const col = await getCollectionWithListProducts(collectionHandle, { first: 8 })
    if (!col?.products?.edges?.length) return null

    const nodes = col.products.edges.map((e) => e.node).filter(
      (p) => p.handle !== 'street_lamp' && !p.handle?.startsWith('street-lamp')
    )
    if (nodes.length === 0) return null

    const vendorName = nodes[0].vendor || col.title || collectionHandle.replace(/-/g, ' ')
    const productIds = nodes
      .slice(0, 4)
      .map((p) => p.id.replace(/^gid:\/\/shopify\/Product\//i, '') || p.id)
      .filter(Boolean)
    const newest = nodes[0]

    const { bio, image, vendorSlug, instagram } = await getVendorMeta(supabase, vendorName, null)
    const handle = vendorSlug || slugify(vendorName) || collectionHandle
    const artistImage = image || (await getArtistImageByHandle(handle))
    const collectionBio = !bio ? await getCollectionDescription(handle) : undefined
    const collectionInstagram = !instagram ? await getCollectionInstagram(handle) : undefined

    return {
      vendorName,
      vendorSlug: handle,
      bio: bio || collectionBio,
      instagram: instagram || collectionInstagram,
      image: artistImage || col.image?.url || newest.featuredImage?.url || newest.images?.edges?.[0]?.node?.url,
      productIds: productIds.length > 0 ? productIds : [newest.id.replace(/^gid:\/\/shopify\/Product\//i, '') || newest.id],
      seriesName: col.title !== vendorName ? col.title : undefined,
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
    const { bio, image, vendorSlug, instagram } = await getVendorMeta(supabase, vendorName, null)
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
    const { bio: metaBio, image: metaImage, vendorSlug, instagram } = await getVendorMeta(supabase, series.vendor_name, series.vendor_id)
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
  }
}

async function getVendorMeta(
  supabase: ReturnType<typeof createClient>,
  vendorName: string,
  vendorId: number | null
): Promise<{ bio?: string; image?: string; vendorSlug?: string; instagram?: string }> {
  let bio: string | undefined
  let image: string | undefined
  let vendorSlug: string | undefined
  let instagram: string | undefined

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
      }
    } catch {
      // Ignore
    }
  }

  return { bio, image, vendorSlug, instagram }
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
