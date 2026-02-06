import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/shopify/storefront-client'

/**
 * GET /api/shop/collections/[handle]
 * 
 * Fetch products from a specific Shopify collection by handle.
 * Used for recommendations, featured products, etc.
 */
export async function GET(
  request: Request,
  { params }: { params: { handle: string } }
) {
  try {
    const { handle } = params
    
    // Fetch collection with products
    const collection = await getCollection(handle, {
      first: 12, // Get up to 12 products
      sortKey: 'CREATED_AT',
      reverse: true, // Newest first
    })

    return NextResponse.json({
      success: true,
      collection: collection.handle,
      products: collection.products || [],
      count: collection.products?.length || 0,
    })
  } catch (error) {
    console.error(`[API] Failed to fetch collection ${params.handle}:`, error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch collection products',
        products: [],
      },
      { status: 500 }
    )
  }
}
