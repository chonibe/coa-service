import { NextRequest, NextResponse } from 'next/server'
import { getCollection, getProductsByVendor } from '@/lib/shopify/storefront-client'
import { createClient } from '@/lib/supabase/server'

/**
 * Artist/Vendor Profile API
 * 
 * Returns enriched artist profile by merging:
 * - Shopify collection/vendor data (products, collection image)
 * - Supabase vendor data (bio, instagram, profile_image, signature_url, website)
 * - Supabase artwork_series (series by this vendor)
 * - Anonymized collector count (social proof)
 */

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  
  try {
    // Derive the artist name from slug for database lookups
    const artistName = slug.replace(/-/g, ' ')
    
    // Fetch Shopify data and Supabase data in parallel
    const [shopifyData, vendorData] = await Promise.all([
      fetchShopifyArtistData(slug, artistName),
      fetchSupabaseVendorData(artistName),
    ])

    if (!shopifyData) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      )
    }

    // Merge Shopify + Supabase data (Supabase takes priority for profile fields)
    const artist = {
      name: shopifyData.name,
      slug,
      // Supabase bio takes priority, then Shopify collection description
      bio: vendorData?.bio || vendorData?.artist_bio || shopifyData.bio || undefined,
      artistHistory: vendorData?.artist_history || undefined,
      // Supabase profile image takes priority
      image: vendorData?.profile_picture_url || vendorData?.profile_image || shopifyData.image || undefined,
      signatureUrl: vendorData?.signature_url || undefined,
      instagramUrl: vendorData?.instagram_url || undefined,
      website: vendorData?.website || undefined,
      // Products from Shopify
      products: shopifyData.products,
      // Series from Supabase
      series: vendorData?.series || [],
      // Anonymized collector count
      collectorCount: vendorData?.collectorCount || 0,
      // Vendor ID for internal references
      vendorId: vendorData?.id || undefined,
    }
    
    return NextResponse.json(artist)
  } catch (error) {
    console.error('[Artist API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch artist', products: [] },
      { status: 500 }
    )
  }
}

/**
 * Fetch artist data from Shopify (collection or vendor products)
 */
async function fetchShopifyArtistData(slug: string, artistName: string) {
  // First, try to fetch the artist's collection by handle (slug)
  const collection = await getCollection(slug, {
    first: 50,
    sortKey: 'CREATED_AT',
    reverse: true,
  })
  
  if (collection) {
    const products = collection.products?.edges?.map(edge => edge.node) || []
    return {
      name: collection.title,
      bio: collection.description || collection.descriptionHtml?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
      image: collection.image?.url,
      products,
    }
  }
  
  // Fallback: fetch by vendor name
  const { products: vendorProducts } = await getProductsByVendor(artistName, {
    first: 50,
    sortKey: 'CREATED_AT',
    reverse: true,
  })
  
  if (vendorProducts.length === 0) {
    return null
  }
  
  return {
    name: vendorProducts[0].vendor || artistName,
    bio: vendorProducts[0].description || undefined,
    image: vendorProducts[0].featuredImage?.url,
    products: vendorProducts,
  }
}

/**
 * Fetch enriched vendor data from Supabase
 * Includes: profile fields, series, and anonymized collector count
 */
async function fetchSupabaseVendorData(artistName: string) {
  try {
    const supabase = await createClient()

    // 1. Look up vendor by vendor_name (case-insensitive)
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select(`
        id,
        vendor_name,
        bio,
        artist_bio,
        artist_history,
        instagram_url,
        website,
        profile_image,
        profile_picture_url,
        signature_url
      `)
      .ilike('vendor_name', artistName)
      .eq('status', 'active')
      .single()

    if (vendorError || !vendor) {
      return null
    }

    // 2. Fetch series by this vendor (in parallel with collector count)
    const [seriesResult, collectorCountResult] = await Promise.all([
      supabase
        .from('artwork_series')
        .select(`
          id,
          name,
          description,
          thumbnail_url,
          is_active
        `)
        .eq('vendor_id', vendor.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true }),
      
      // 3. Anonymized collector count: distinct collectors who own this vendor's work
      supabase
        .from('line_items')
        .select('owner_email', { count: 'exact', head: false })
        .eq('vendor_name', vendor.vendor_name)
        .eq('status', 'active')
        .not('owner_email', 'is', null),
    ])

    const series = (seriesResult.data || []).map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      thumbnail_url: s.thumbnail_url,
    }))

    // Count distinct collector emails
    const uniqueCollectors = new Set(
      (collectorCountResult.data || []).map((row: any) => row.owner_email)
    )

    return {
      ...vendor,
      series,
      collectorCount: uniqueCollectors.size,
    }
  } catch (error) {
    console.error('[Artist API] Supabase vendor lookup error:', error)
    return null
  }
}
