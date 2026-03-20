/**
 * Helpers for the experience artwork carousel: `cartOrder` can list the same
 * product ID multiple times (quantity), but the carousel shows one tile per product.
 */

/** First-occurrence order of product IDs — one carousel slot per product. */
export function uniqueCartIdsInOrder(cartOrder: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of cartOrder) {
    if (seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

/** Carousel slot index (0..unique-1) for a product in the current cart order. */
export function carouselSlotIndexForProductId(cartOrder: string[], productId: string): number {
  return uniqueCartIdsInOrder(cartOrder).indexOf(productId)
}

export function clampCarouselIndex(active: number, cartOrder: string[]): number {
  const u = uniqueCartIdsInOrder(cartOrder)
  if (u.length === 0) return -1
  return Math.min(Math.max(0, active), u.length - 1)
}
