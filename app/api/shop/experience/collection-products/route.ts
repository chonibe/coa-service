import { NextResponse } from 'next/server'
import {
  getCollectionWithListProducts,
  isStorefrontConfigured,
} from '@/lib/shopify/storefront-client'

const ALLOWED_HANDLES = new Set(['season-1', '2025-edition'])

/**
 * GET /api/shop/experience/collection-products?handle=season-1&after=<cursor>&first=36
 *
 * Fetches paginated products for the experience configurator.
 * Used for progressive loading when user scrolls near bottom.
 */
export async function GET(request: Request) {
  if (!isStorefrontConfigured()) {
    return NextResponse.json(
      { products: [], hasNextPage: false, endCursor: null },
      { status: 200 }
    )
  }

  const { searchParams } = new URL(request.url)
  const handle = searchParams.get('handle')
  const after = searchParams.get('after') || undefined
  const first = Math.min(250, Math.max(12, parseInt(searchParams.get('first') || '36', 10) || 36))

  if (!handle || !ALLOWED_HANDLES.has(handle)) {
    return NextResponse.json(
      { error: 'Invalid handle', products: [], hasNextPage: false, endCursor: null },
      { status: 400 }
    )
  }

  try {
    const collection = await getCollectionWithListProducts(handle, {
      first,
      after,
    })

    if (!collection) {
      return NextResponse.json({
        products: [],
        hasNextPage: false,
        endCursor: null,
      })
    }

    const products = collection.products?.edges?.map((e) => e.node) ?? []
    const pageInfo = collection.products?.pageInfo ?? { hasNextPage: false, endCursor: null }

    return NextResponse.json({
      products,
      hasNextPage: pageInfo.hasNextPage ?? false,
      endCursor: pageInfo.endCursor ?? null,
    })
  } catch (error) {
    console.error('[API] Failed to fetch experience collection products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products', products: [], hasNextPage: false, endCursor: null },
      { status: 500 }
    )
  }
}
