import type { ShopifyProduct } from '@/lib/shopify/storefront-client'

/** Numeric Shopify product id (no gid prefix). */
export function normalizeExperienceProductKey(productId: string): string {
  return productId.replace(/^gid:\/\/shopify\/Product\//i, '') || productId
}

export function storefrontVariantUsd(product: ShopifyProduct): number {
  const amount = product.priceRange?.minVariantPrice?.amount
  return amount ? parseFloat(amount) : 0
}

export type ExperienceArtworkPriceMaps = {
  lockedUsdByProductId?: Record<string, number>
  /** From `/api/shop/edition-states` → `priceUsd` (Street ladder buy-now price). */
  streetLadderUsdByProductId?: Record<string, number>
}

/**
 * Experience cart / checkout unit USD for an artwork line:
 * Reserve lock → Street ladder (when present) → Shopify storefront variant price.
 */
export function experienceArtworkUnitUsd(
  product: ShopifyProduct,
  maps?: ExperienceArtworkPriceMaps
): number {
  const base = storefrontVariantUsd(product)
  const key = normalizeExperienceProductKey(product.id)
  const locked = maps?.lockedUsdByProductId?.[key]
  if (locked != null && locked > 0) return locked
  const ladder = maps?.streetLadderUsdByProductId?.[key]
  if (ladder != null && ladder > 0) return ladder
  return base
}
