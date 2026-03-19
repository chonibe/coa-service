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
    // Sum inventory across ALL variants — for multi-variant products (e.g. sizes),
    // first variant alone would undercount. For single-variant limited editions, total = first.
    const totalFromVariants = variants.reduce(
      (sum: number, v: { inventory_quantity?: number }) => sum + (v.inventory_quantity ?? 0),
      0
    )
    // If variant.inventory_quantity is deprecated/missing (all undefined), try inventory_levels API
    const hasVariantInventoryData = variants.some(
      (v: { inventory_quantity?: number }) => typeof v.inventory_quantity === 'number'
    )
    let quantityAvailable: number | null = hasVariantInventoryData ? totalFromVariants : null
    if (quantityAvailable === null && variants.length > 0) {
      const inventoryItemIds = variants
        .map((v: { inventory_item_id?: number }) => v.inventory_item_id)
        .filter((id): id is number => typeof id === 'number')
      if (inventoryItemIds.length > 0) {
        const levelsUrl = `https://${SHOPIFY_SHOP}/admin/api/2024-01/inventory_levels.json?inventory_item_ids=${inventoryItemIds.join(',')}`
        const levelsRes = await fetch(levelsUrl, {
          headers: {
            'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN!,
            'Content-Type': 'application/json',
          },
        })
        if (levelsRes.ok) {
          const levelsData = await levelsRes.json()
          const levels = levelsData?.inventory_levels ?? []
          quantityAvailable = levels.reduce(
            (sum: number, l: { available?: number; inventory_quantity?: number }) =>
              sum + (l.available ?? l.inventory_quantity ?? 0),
            0
          )
        }
      }
    }
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
