import { normalizeShopifyProductId } from '@/lib/shop/shopify-product-id'

/**
 * Override line `price` (USD dollars) when we have a Street ladder row for that product.
 * Used by checkout APIs and (optionally) cart display logic.
 */
export function applyStreetLadderUsdToLineItems<T extends { productId: string; price: number }>(
  items: T[],
  ladderUsdByNumericProductId: Record<string, number>
): T[] {
  return items.map((item) => {
    const key = normalizeShopifyProductId(item.productId)
    const u = key ? ladderUsdByNumericProductId[key] : undefined
    if (u != null && u > 0) return { ...item, price: u }
    return item
  })
}
