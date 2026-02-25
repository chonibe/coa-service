import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getVendorCollectionHandle } from '@/lib/shopify/collections'
import { getCollection, getCollectionById, getProductsByVendor, type ShopifyProduct } from '@/lib/shopify/storefront-client'

/**
 * Artist/Vendor Profile API
 *
 * Matches Liquid pattern: collections[vendor_handle] where vendor_handle = product.vendor | handle.
 * Uses vendor_collections when available, else getVendorCollectionHandle(vendorName) for Shopify convention.
 * Bio priority: 1. Vendor bio 2. Collection description 3. Product description
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

  try {
    const supabase = createClient()

    // 1. Find vendor and their paired collection from vendor_collections
    let vendorBio: string | undefined
    let pairedCollectionId: string | null = null
    let pairedCollectionHandle: string | null = null
    let vendorName: string | undefined

    try {
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id, bio, vendor_name')
        .ilike('vendor_name', artistNameForMatch)
        .maybeSingle()

      if (vendor) {
        vendorBio = vendor.bio?.trim() || undefined
        vendorName = vendor.vendor_name

        const { data: vendorCollection } = await supabase
          .from('vendor_collections')
          .select('shopify_collection_id, shopify_collection_handle')
          .eq('vendor_id', vendor.id)
          .maybeSingle()

        pairedCollectionId = vendorCollection?.shopify_collection_id ?? null
        pairedCollectionHandle = vendorCollection?.shopify_collection_handle ?? null
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
      const artist = {
        name: vendorName || collection.title,
        slug,
        bio: vendorBio || (collectionDesc || undefined),
        image: collection.image?.url,
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
      return NextResponse.json(
        { error: 'Artist not found', products: [] },
        { status: 404 }
      )
    }

    const artist = {
      name: vendorName || vendorProducts[0]?.vendor || artistNameForMatch,
      slug,
      bio: vendorBio || collectionDesc || vendorProducts[0]?.description || undefined,
      image: vendorProducts[0]?.featuredImage?.url,
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
