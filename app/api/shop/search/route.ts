import { NextRequest, NextResponse } from 'next/server'
import { getProducts, getCollections } from '@/lib/shopify/storefront-client'

/**
 * Shop Search API
 * 
 * Searches products and collections using the Shopify Storefront API.
 * Returns matching products and collections for predictive search.
 */

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ products: [], collections: [] })
    }
    
    // Search products and collections in parallel
    const [productsResult, collectionsResult] = await Promise.all([
      getProducts({ first: 8, query: `title:*${query}* OR vendor:*${query}* OR tag:*${query}*` }).catch(() => ({ products: [] })),
      getCollections({ first: 4, query: `title:*${query}*` }).catch(() => ({ collections: [] })),
    ])
    
    return NextResponse.json({
      products: productsResult.products || [],
      collections: collectionsResult.collections || [],
      query,
    })
  } catch (error) {
    console.error('[Search API] Error:', error)
    return NextResponse.json(
      { error: 'Search failed', products: [], collections: [] },
      { status: 500 }
    )
  }
}
