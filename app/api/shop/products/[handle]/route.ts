import { NextResponse } from 'next/server'
import { getProduct } from '@/lib/shopify/storefront-client'

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
    
    return NextResponse.json({ product })
  } catch (error: any) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product' },
      { status: 500 }
    )
  }
}
