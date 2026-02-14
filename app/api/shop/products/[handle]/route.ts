import { NextResponse } from 'next/server'
import { getProduct, getProductsByVendor } from '@/lib/shopify/storefront-client'
import { 
  getProductSeriesInfo, 
  getProductEditionInfo,
  getCollectorSeriesProgress 
} from '@/lib/shop/series'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  context: { params: Promise<{ handle: string }> }
) {
  try {
    // In Next.js 15+, params is a Promise that must be awaited
    const { handle } = await context.params
    const product = await getProduct(handle)
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
    
    // Fetch series info, edition info, artist data, and "more from artist" in parallel
    const [seriesInfo, editionInfo, artistData, moreFromArtist] = await Promise.all([
      getProductSeriesInfo(product.id).catch(() => null),
      getProductEditionInfo(product.id).catch(() => null),
      fetchArtistAvatarUrl(product.vendor).catch(() => null),
      fetchMoreFromArtist(product.vendor, handle).catch(() => []),
    ])
    
    // Fetch collector progress if authenticated
    let collectorProgress = null
    let ownedProductIds: string[] = []
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user?.email) {
        if (seriesInfo) {
          collectorProgress = await getCollectorSeriesProgress(
            seriesInfo.id,
            user.email
          )
        }
        // Fetch owned product IDs for "In your collection" badges
        ownedProductIds = await getOwnedProductIds(user.email)
      }
    } catch (error) {
      // Non-critical error, continue without progress
      console.debug('Could not fetch collector data:', error)
    }
    
    return NextResponse.json({ 
      product,
      seriesInfo,
      editionInfo,
      collectorProgress,
      artistAvatarUrl: artistData?.avatarUrl || null,
      moreFromArtist: moreFromArtist || [],
      ownedProductIds,
    })
  } catch (error: any) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

/**
 * Fetch artist avatar URL from vendors table
 */
async function fetchArtistAvatarUrl(vendorName: string | undefined): Promise<{ avatarUrl: string | null } | null> {
  if (!vendorName) return null
  
  const supabase = await createClient()
  const { data: vendor } = await supabase
    .from('vendors')
    .select('profile_picture_url, profile_image')
    .ilike('vendor_name', vendorName)
    .eq('status', 'active')
    .single()

  if (!vendor) return null
  return { avatarUrl: vendor.profile_picture_url || vendor.profile_image || null }
}

/**
 * Fetch more products from the same artist (excluding current product)
 */
async function fetchMoreFromArtist(vendorName: string | undefined, currentHandle: string) {
  if (!vendorName) return []
  
  const { products } = await getProductsByVendor(vendorName, {
    first: 8,
    sortKey: 'CREATED_AT',
    reverse: true,
  })
  
  // Exclude current product
  return products.filter(p => p.handle !== currentHandle).slice(0, 4)
}

/**
 * Get Shopify product handles that a collector owns (for "In your collection" badges)
 * 
 * Uses line_items -> vendor_product_submissions join to find owned product handles.
 * Note: line_items has columns (submission_id, owner_email) that may not be in 
 * generated Supabase types — runtime columns added via migrations.
 */
async function getOwnedProductIds(email: string): Promise<string[]> {
  try {
    const supabase = await createClient()
    
    // Get submission IDs owned by this collector through line_items
    // Cast to any to handle columns not in generated types
    const { data: lineItems } = await (supabase as any)
      .from('line_items')
      .select('submission_id')
      .eq('owner_email', email)
      .eq('status', 'active')
      .not('submission_id', 'is', null)

    if (!lineItems || lineItems.length === 0) return []
    
    const submissionIds = [...new Set(
      (lineItems as any[]).map((li: any) => li.submission_id).filter(Boolean)
    )]
    
    // Look up shopify product handles from submissions
    const { data: submissions } = await (supabase as any)
      .from('vendor_product_submissions')
      .select('shopify_product_handle')
      .in('id', submissionIds)
      .not('shopify_product_handle', 'is', null)

    if (!submissions) return []
    
    return [...new Set(
      (submissions as any[]).map((s: any) => s.shopify_product_handle).filter(Boolean)
    )] as string[]
  } catch {
    return []
  }
}
