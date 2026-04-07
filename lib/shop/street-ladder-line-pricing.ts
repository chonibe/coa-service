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

/** When set, checkout must keep the request `price` (experience: lamp tiers, featured bundle, etc.). */
export type CheckoutLinePriceBasis = 'client'

export type CheckoutLineForUsdResolution = {
  productId: string
  price: number
  priceBasis?: CheckoutLinePriceBasis
}

/**
 * Resolve USD unit price for each checkout line to match storefront rules:
 * 1. Active reserve lock (signed-in user)
 * 2. Else `priceBasis === 'client'` → keep request price (lamp volume, bundle SKUs, multi-line lamp)
 * 3. Else Street ladder from `products` when present
 * 4. Else request price (Shopify / Storefront-derived amounts from the client)
 *
 * Replaces blind `applyStreetLadderUsdToLineItems` for flows that already computed ladder/locks/bundle on the client.
 */
export function resolveCheckoutLineUsdItems<T extends CheckoutLineForUsdResolution>(
  items: T[],
  opts: {
    ladderUsdByNumericProductId: Record<string, number>
    lockedUsdByNumericProductId: Record<string, number>
  }
): T[] {
  return items.map((item) => {
    const key = normalizeShopifyProductId(item.productId)
    if (!key) return item

    const locked = opts.lockedUsdByNumericProductId[key]
    if (locked != null && locked > 0) {
      return { ...item, price: locked }
    }
    if (item.priceBasis === 'client') {
      return item
    }
    const ladder = opts.ladderUsdByNumericProductId[key]
    if (ladder != null && ladder > 0) {
      return { ...item, price: ladder }
    }
    return item
  })
}
