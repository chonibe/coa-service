import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getProducts } from '@/lib/shopify/storefront-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const type = searchParams.get('type')
    const exclude = searchParams.get('exclude')
    
    // Build query for filtering
    let query = ''
    if (type) {
      query = `product_type:${type}`
    }
    
    const result = await getProducts({
      first: limit + (exclude ? 1 : 0), // Fetch one extra if excluding
      query: query || undefined,
    })
    
    let products = result.products
    
    // Exclude specific product by handle
    if (exclude) {
      products = products.filter(p => p.handle !== exclude)
      // Limit to requested count after exclusion
      products = products.slice(0, limit)
    }
    
    return NextResponse.json({
      products,
      pageInfo: result.pageInfo,
    })
  } catch (error: any) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
