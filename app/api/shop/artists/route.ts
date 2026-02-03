import { NextRequest, NextResponse } from 'next/server'
import { getProducts } from '@/lib/shopify/storefront-client'

/**
 * Artists/Vendors List API
 * 
 * Returns all unique vendors/artists from Shopify products.
 */

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Fetch all products to get unique vendors
    const { products } = await getProducts({ first: 250 })
    
    // Group products by vendor
    const vendorMap = new Map<string, { count: number; image?: string }>()
    
    products.forEach((product) => {
      if (product.vendor) {
        const existing = vendorMap.get(product.vendor)
        if (existing) {
          existing.count++
        } else {
          vendorMap.set(product.vendor, {
            count: 1,
            // Use first product's image as vendor image (could be improved with actual vendor images)
            image: product.featuredImage?.url,
          })
        }
      }
    })
    
    // Convert to array and sort by name
    const artists = Array.from(vendorMap.entries())
      .map(([name, data]) => ({
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        productCount: data.count,
        image: data.image,
      }))
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
