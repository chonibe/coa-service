import type { SpotlightData } from '@/app/(store)/shop/experience-v2/components/ArtistSpotlightBanner'

type ProductLike = { id: string; vendor?: string | null }

function numericProductId(id: string): string {
  return id.replace(/^gid:\/\/shopify\/Product\//i, '') || id
}

/**
 * Whether the storefront product should reuse the loaded artist-spotlight payload
 * (same bio/image as the selector banner). Strict `vendor === vendorName` fails when
 * Shopify vendor text differs slightly from spotlight API (e.g. punctuation, “AC” vs “J.C.”).
 */
export function productMatchesSpotlight(
  product: ProductLike | null | undefined,
  spotlight: SpotlightData | null | undefined
): boolean {
  if (!product?.id || !spotlight) return false
  const pid = numericProductId(product.id)
  const ids = spotlight.productIds ?? []
  for (const raw of ids) {
    if (!raw) continue
    if (raw === product.id || numericProductId(raw) === pid) return true
  }
  const v = (product.vendor ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
  const vn = (spotlight.vendorName ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
  if (v && vn && v === vn) return true
  const alnum = (s: string) => s.replace(/[^a-z0-9]+/g, '')
  if (v && vn && alnum(v) === alnum(vn)) return true
  return false
}

/** Slug + full spotlight for accordions / detail when this product is part of the current spotlight. */
export function spotlightOverridesForProduct(
  product: ProductLike | null | undefined,
  lampProductId: string,
  spotlight: SpotlightData | null | undefined
): { artistSlugOverride?: string; spotlightDataOverride: SpotlightData | null } {
  if (!product || product.id === lampProductId || !spotlight || !productMatchesSpotlight(product, spotlight)) {
    return { artistSlugOverride: undefined, spotlightDataOverride: null }
  }
  return {
    artistSlugOverride: spotlight.vendorSlug,
    spotlightDataOverride: spotlight,
  }
}
