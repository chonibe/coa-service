import { NextResponse } from 'next/server'
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from '@/lib/env'

/** Extract numeric Shopify ID from Storefront gid (e.g. gid://shopify/Product/123456) */
function parseGid(gid: string): string | null {
  const match = gid?.match(/\/Product\/(\d+)$/) || gid?.match(/(\d+)$/)
  return match ? match[1] : null
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const productId = parseGid(id) || id
    if (!productId) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }
    if (!SHOPIFY_SHOP || !SHOPIFY_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'Shopify not configured' },
        { status: 503 }
      )
    }
    const url = `https://${SHOPIFY_SHOP}/admin/api/2024-01/products/${productId}.json`
    const res = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) {
      const text = await res.text()
      console.error('[Quantity API] Shopify error:', res.status, text.slice(0, 200))
      return NextResponse.json(
        { error: 'Failed to fetch product' },
        { status: res.status }
      )
    }
    const data = await res.json()
    const variants = data?.product?.variants ?? []
    const total = variants.reduce((sum: number, v: { inventory_quantity?: number }) => sum + (v.inventory_quantity ?? 0), 0)
    const firstVariant = variants[0]
    const quantityAvailable = firstVariant?.inventory_quantity ?? total
    return NextResponse.json({
      quantityAvailable: typeof quantityAvailable === 'number' ? quantityAvailable : null,
      editionSize: null,
    })
  } catch (err: unknown) {
    console.error('[Quantity API] Error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch quantity' },
      { status: 500 }
    )
  }
}
