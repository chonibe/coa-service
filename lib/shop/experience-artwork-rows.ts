import type { ShopifyProduct } from '@/lib/shopify/storefront-client'

/**
 * Groups products into display rows: stable vendor order (first appearance in `products`),
 * then pairs within each vendor (same pattern as a 2-up grid, but scoped per artist).
 */
export function buildArtworkRowsByArtist(products: ShopifyProduct[]): ShopifyProduct[][] {
  const vendorOrder: string[] = []
  const buckets = new Map<string, ShopifyProduct[]>()

  for (const p of products) {
    const v = p.vendor?.trim() || 'Artist'
    if (!buckets.has(v)) {
      vendorOrder.push(v)
      buckets.set(v, [])
    }
    buckets.get(v)!.push(p)
  }

  const rows: ShopifyProduct[][] = []
  for (const v of vendorOrder) {
    const list = buckets.get(v)!
    for (let i = 0; i < list.length; i += 2) {
      rows.push(list.slice(i, i + 2))
    }
  }
  return rows
}

/** Virtual row index that contains this product id (0 if not found). */
export function rowIndexForProductId(rows: ShopifyProduct[][], productId: string): number {
  for (let r = 0; r < rows.length; r++) {
    if (rows[r].some((p) => p.id === productId)) return r
  }
  return 0
}
