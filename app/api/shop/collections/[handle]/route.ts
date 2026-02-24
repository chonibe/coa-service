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
  context: { params: Promise<{ handle: string }> | { handle: string } }
) {
  let handle: string
  try {
    const params = context.params instanceof Promise ? await context.params : context.params
    handle = params.handle
  } catch (e) {
    console.error('[API] Failed to resolve collection params:', e)
    return NextResponse.json(
      { success: false, error: 'Invalid request', products: [], count: 0 },
      { status: 400 }
    )
  }

  try {
    const collection = await getCollection(handle, {
      first: 12,
      sortKey: 'CREATED_AT',
      reverse: true,
    })

    if (!collection) {
      return NextResponse.json(
        { success: false, error: 'Collection not found', products: [], count: 0 },
        { status: 404 }
      )
    }

    const products = collection.products?.edges?.map((e) => e.node) ?? []

    return NextResponse.json({
      success: true,
      collection: collection.handle,
      products,
      count: products.length,
    })
  } catch (error) {
    console.error(`[API] Failed to fetch collection "${handle}":`, error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch collection products',
        products: [],
        count: 0,
      },
      { status: 500 }
    )
  }
}
