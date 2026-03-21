import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getVendorCollectionHandle } from '@/lib/shopify/collections'
import { getCollectionInstagram } from '@/lib/shopify/artist-image'
import { getCollection, getCollectionById, getProductsByVendor, type ShopifyProduct } from '@/lib/shopify/storefront-client'
import { hasPage, getPage } from '@/content/shopify-content'

function parseInstagramHandle(value: string): string {
  const trimmed = value.trim()
  const match = trimmed.match(/(?:instagram\.com\/|instagr\.am\/|@)([a-zA-Z0-9._]+)/i)
  if (match) return match[1]
  if (trimmed.startsWith('@')) return trimmed.slice(1)
  return trimmed
}

/** Get bio from synced Shopify page content — same fallback as artist page and information cards */
function getBioFromShopifyPage(handle: string): string | undefined {
  const base = handle.replace(/-\d+$/, '')
  const handlesToTry = [handle, base, `${base}-one`].filter(Boolean)
  const unique = [...new Set(handlesToTry)]
  for (const h of unique) {
    if (hasPage(h)) {
      const page = getPage(h)
      if (page?.body?.trim()) {
        return page.body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      }
    }
  }
  return undefined
}

/**
 * Artist/Vendor Profile API
 *
 * Matches Liquid pattern: collections[vendor_handle] where vendor_handle = product.vendor | handle.
 * Uses vendor_collections when available, else getVendorCollectionHandle(vendorName) for Shopify convention.
 * Bio priority: 1. Vendor bio 2. Collection description 3. Product description
 *
 * Vendor lookup order:
 * 1. vendor_collections by shopify_collection_handle (handles accents, slug variants)
 * 2. vendors by vendor_name ilike (artistNameForMatch, or without trailing -N)
 */

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const { searchParams } = new URL(request.url)
  const vendorParam = searchParams.get('vendor')
  const artistNameForMatch = (vendorParam || slug.replace(/-/g, ' ')).trim()
  const artistNameBase = slug.replace(/-\d+$/, '').replace(/-/g, ' ').trim()
  /** Same normalization as artists listing API — fixes e.g. jack-j.c.-art → jack-j-c-art */
  const slugAsShopifyHandle = getVendorCollectionHandle(artistNameForMatch)

  try {
    const supabase = createClient()

    let vendorBio: string | undefined
    let vendorInstagram: string | undefined
    let pairedCollectionId: string | null = null
    let pairedCollectionHandle: string | null = null
    let vendorName: string | undefined

    try {
      // 1a. Look up by vendor_collections.handle first (handles accents, e.g. Jérôme Masi -> jerome-masi)
      const handlesToTry = [...new Set([slug, slug.replace(/-\d+$/, ''), slugAsShopifyHandle].filter(Boolean))]
      for (const h of handlesToTry) {
        const { data: vc } = await supabase
          .from('vendor_collections')
          .select('vendor_id, shopify_collection_id, shopify_collection_handle, vendor_name')
          .eq('shopify_collection_handle', h)
          .maybeSingle()

        if (vc?.vendor_id) {
          const { data: vendor } = await supabase
            .from('vendors')
            .select('id, bio, vendor_name, instagram_url')
            .eq('id', vc.vendor_id)
            .maybeSingle()

          if (vendor) {
            vendorBio = vendor.bio?.trim() || undefined
            vendorName = vendor.vendor_name
            const v = vendor as { instagram_url?: string }
            if (v?.instagram_url?.trim()) vendorInstagram = parseInstagramHandle(v.instagram_url)
            pairedCollectionId = vc.shopify_collection_id ?? null
            pairedCollectionHandle = vc.shopify_collection_handle ?? null
            break
          }
        }
      }

      // 1b. Fallback: vendors by vendor_name ilike (try artistNameForMatch and artistNameBase)
      if (!vendorName) {
        for (const nameToTry of [artistNameForMatch, artistNameBase]) {
          if (!nameToTry) continue
          const { data: vendor } = await supabase
            .from('vendors')
            .select('id, bio, vendor_name, instagram_url')
            .ilike('vendor_name', nameToTry)
            .maybeSingle()

          if (vendor) {
            vendorBio = vendor.bio?.trim() || undefined
            vendorName = vendor.vendor_name
            const v = vendor as { instagram_url?: string }
            if (v?.instagram_url?.trim()) vendorInstagram = parseInstagramHandle(v.instagram_url)

            const { data: vendorCollection } = await supabase
              .from('vendor_collections')
              .select('shopify_collection_id, shopify_collection_handle')
              .eq('vendor_id', vendor.id)
              .maybeSingle()

            pairedCollectionId = vendorCollection?.shopify_collection_id ?? null
            pairedCollectionHandle = vendorCollection?.shopify_collection_handle ?? null
            break
          }
        }
      }
    } catch {
      // Supabase not configured or error, continue
    }

    // 2. Fetch collection - prefer ID from vendor_collections (e.g. 685744914818), then handle
    let collection = null

    if (pairedCollectionId) {
      collection = await getCollectionById(pairedCollectionId, {
        first: 50,
        sortKey: 'CREATED',
        reverse: true,
      })
    }

    if (!collection) {
      const canonicalHandle = vendorName ? getVendorCollectionHandle(vendorName) : slug
      const handlesToTry = [
        pairedCollectionHandle,
        canonicalHandle !== slug ? canonicalHandle : null,
        slugAsShopifyHandle !== slug ? slugAsShopifyHandle : null,
        slug,
      ].filter(Boolean) as string[]
      const uniqueHandles = [...new Set(handlesToTry)]

      for (const handle of uniqueHandles) {
        try {
          collection = await getCollection(handle, {
            first: 50,
            sortKey: 'CREATED',
            reverse: true,
          })
          if (collection) break
        } catch {
          continue
        }
      }
    }

    const collectionDesc = collection?.description
      || (collection?.descriptionHtml
        ? collection.descriptionHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        : '')

    if (collection?.products?.edges?.length) {
      const products = collection.products.edges.map((edge) => edge.node)
      let instagram = vendorInstagram
      if (!instagram && pairedCollectionHandle) {
        instagram = await getCollectionInstagram(pairedCollectionHandle)
      }
      const bio = vendorBio || (collectionDesc || undefined) || getBioFromShopifyPage(slug)
      const artist = {
        name: vendorName || collection.title,
        slug,
        bio: bio || undefined,
        image: collection.image?.url,
        instagram: instagram || undefined,
        products,
      }
      return NextResponse.json(artist)
    }

    // Fallback: fetch by vendor name when no collection found
    let vendorProducts: ShopifyProduct[] = []
    try {
      const result = await getProductsByVendor(artistNameForMatch, {
        first: 50,
        sortKey: 'CREATED_AT',
        reverse: true,
      })
      vendorProducts = result?.products ?? []
    } catch (vendorErr) {
      console.warn('[Artist API] Vendor lookup failed for', slug, vendorErr)
    }

    if (vendorProducts.length === 0) {
      // Last resort: collection may exist in Shopify by handle but not in vendor_collections (e.g. unlisted)
      const fallbackHandles = [
        slug,
        slug.replace(/-\d+$/, ''),
        slugAsShopifyHandle,
        `${slug.replace(/-\d+$/, '')}-one`,
      ]
      for (const h of [...new Set(fallbackHandles)].filter(Boolean)) {
        try {
          const col = await getCollection(h, { first: 1 })
          if (col?.title) {
            const name = vendorName || col.title || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
            const products = col.products?.edges?.map((e) => e.node) ?? []
            const colBio = col.description?.trim() || (col.descriptionHtml ? col.descriptionHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '')
            const bio = vendorBio || colBio || getBioFromShopifyPage(slug)
            const artist = {
              name,
              slug,
              bio: bio || undefined,
              image: col.image?.url,
              instagram: vendorInstagram || (await getCollectionInstagram(h)) || undefined,
              products,
            }
            return NextResponse.json(artist)
          }
        } catch {
          continue
        }
      }
      return NextResponse.json(
        { error: 'Artist not found', products: [] },
        { status: 404 }
      )
    }

    // If we have products but no bio/instagram yet, try vendor lookup by product's vendor name
    if ((!vendorBio || !vendorInstagram) && vendorProducts[0]?.vendor) {
      try {
        const { data: vendor } = await supabase
          .from('vendors')
          .select('bio, vendor_name')
          .ilike('vendor_name', vendorProducts[0].vendor)
          .maybeSingle()
        if (vendor?.bio?.trim()) {
          vendorBio = vendor.bio.trim()
        }
        if (vendor?.vendor_name && !vendorName) {
          vendorName = vendor.vendor_name
        }
      } catch {
        // Ignore
      }
    }

    let instagram = vendorInstagram
    if (!instagram) {
      const handle = vendorName ? getVendorCollectionHandle(vendorName) : slug
      instagram = await getCollectionInstagram(handle)
    }
    const bio = vendorBio || collectionDesc || vendorProducts[0]?.description || getBioFromShopifyPage(slug)
    const artist = {
      name: vendorName || vendorProducts[0]?.vendor || artistNameForMatch,
      slug,
      bio: bio || undefined,
      image: vendorProducts[0]?.featuredImage?.url,
      instagram: instagram || undefined,
      products: vendorProducts,
    }
    return NextResponse.json(artist)
  } catch (error) {
    console.error('[Artist API] Error for slug', slug, ':', error)
    return NextResponse.json(
      { error: 'Failed to fetch artist', products: [] },
      { status: 500 }
    )
  }
}
