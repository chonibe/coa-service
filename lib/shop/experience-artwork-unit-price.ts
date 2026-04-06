import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { streetEditionRowFromStorefrontProduct } from '@/lib/shop/street-edition-from-storefront'

/** Numeric Shopify product id (no gid prefix). Accepts Storefront gid strings or numeric JSON from APIs. */
export function normalizeExperienceProductKey(productId: string | number): string {
  const s = typeof productId === 'number' && Number.isFinite(productId) ? String(productId) : String(productId ?? '')
  return s.replace(/^gid:\/\/shopify\/Product\//i, '') || s
}

export function storefrontVariantUsd(product: ShopifyProduct): number {
  const amount = product.priceRange?.minVariantPrice?.amount
  return amount ? parseFloat(amount) : 0
}

export type ExperienceArtworkPriceMaps = {
  lockedUsdByProductId?: Record<string, number>
  /** From `/api/shop/edition-states` → `priceUsd` (Street ladder buy-now price). */
  streetLadderUsdByProductId?: Record<string, number>
  /**
   * When Supabase has no `products` row, match ArtworkPickerSheet: derive ladder USD from
   * Storefront `custom.edition_size` + variant inventory (optional season if metafield missing).
   */
  seasonBandsFallback?: 1 | 2
}

/**
 * Experience cart / checkout unit USD for an artwork line:
 * Reserve lock → API Street ladder → Storefront-derived ladder (picker parity) → Shopify variant price.
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
  const sfOpts =
    maps?.seasonBandsFallback != null ? { seasonBandsFallback: maps.seasonBandsFallback } : undefined
  const fromStorefront = streetEditionRowFromStorefrontProduct(product, sfOpts)
  if (fromStorefront?.priceUsd != null && fromStorefront.priceUsd > 0) {
    return fromStorefront.priceUsd
  }
  return base
}
