import { NextRequest, NextResponse } from 'next/server'
import { getVendorCollectionHandle } from '@/lib/shopify/collections'
import { getProducts } from '@/lib/shopify/storefront-client'
import { createClient } from '@/lib/supabase/server'

/**
 * Artists/Vendors List API
 * 
 * Returns all unique vendors/artists from Shopify products,
 * enriched with Supabase vendor profile data (profile images, bios).
 */

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    // Fetch Shopify products and Supabase vendors in parallel
    const [shopifyResult, vendorProfiles] = await Promise.all([
      getProducts({ first: 250 }),
      fetchVendorProfiles(),
    ])

    const { products } = shopifyResult
    
    // Group products by vendor
    const vendorMap = new Map<
      string,
      { count: number; shopifyImage?: string; shopifyImageArea?: number }
    >()

    products.forEach((product) => {
      if (!product.vendor) return
      const existing = vendorMap.get(product.vendor)
      const img = product.featuredImage
      const area = img?.url ? (img.width || 0) * (img.height || 0) : 0
      if (existing) {
        existing.count++
        if (area > (existing.shopifyImageArea ?? 0) && img?.url) {
          existing.shopifyImage = img.url
          existing.shopifyImageArea = area
        }
      } else {
        vendorMap.set(product.vendor, {
          count: 1,
          shopifyImage: img?.url,
          shopifyImageArea: area,
        })
      }
    })

    // Build a lookup map for vendor profiles (case-insensitive)
    const profileLookup = new Map<string, typeof vendorProfiles[number]>()
    vendorProfiles.forEach((v) => {
      profileLookup.set(v.vendor_name.toLowerCase(), v)
    })
    
    // Merge Shopify vendor list with Supabase profile data
    const artists = Array.from(vendorMap.entries())
      .map(([name, data]) => {
        const profile = profileLookup.get(name.toLowerCase())
        return {
          name,
          // Match Shopify collection handles (same as getVendorCollectionHandle — dots/punctuation → hyphens)
          slug: getVendorCollectionHandle(name),
          productCount: data.count,
          // Supabase profile image takes priority over Shopify product image
          image: profile?.profile_picture_url || profile?.profile_image || data.shopifyImage,
          bio: profile?.bio || profile?.artist_bio || undefined,
          instagramUrl: profile?.instagram_url || undefined,
          hasProfile: !!profile,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
    
    return NextResponse.json({ artists })
  } catch (error) {
    console.error('[Artists API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch artists', artists: [] },
      { status: 500 }
    )
  }
}

/**
 * Fetch all active vendor profiles from Supabase
 */
async function fetchVendorProfiles() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('vendors')
      .select(`
        vendor_name,
        bio,
        artist_bio,
        instagram_url,
        profile_image,
        profile_picture_url
      `)
      .eq('status', 'active')

    if (error) {
      console.error('[Artists API] Supabase vendor profiles error:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[Artists API] Supabase error:', error)
    return []
  }
}
