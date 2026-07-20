import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getProductsByIds } from '@/lib/shopify/storefront-client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/shop/cart/products?ids=gid://shopify/Product/1,gid://shopify/Product/2
 * Hydrates persisted experience cart lines for pages outside the experience shell.
 */
export async function GET(request: NextRequest) {
  try {
    const raw = request.nextUrl.searchParams.get('ids') || ''
    const ids = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 50)

    if (ids.length === 0) {
      return NextResponse.json({ products: [] })
    }

    const products = await getProductsByIds(ids)
    return NextResponse.json({ products })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load cart products'
    console.error('[cart/products]', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
