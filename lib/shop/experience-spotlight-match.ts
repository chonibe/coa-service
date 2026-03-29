import type { SpotlightData } from '@/app/(store)/shop/experience-v2/components/ArtistSpotlightBanner'

type ProductLike = { id: string; vendor?: string | null }

function numericProductId(id: string): string {
  return id.replace(/^gid:\/\/shopify\/Product\//i, '') || id
}

export function normalizeExperienceVendorName(s: string | null | undefined): string {
  return (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function alnumVendorKey(s: string): string {
  return normalizeExperienceVendorName(s).replace(/[^a-z0-9]+/g, '')
}

/**
 * Known alnum-collapsed vendor pairs that refer to the same artist (Shopify vs collection title vs typos).
 * Each group shares one canonical first entry for comparison.
 */
const VENDOR_ALNUM_EQUIVALENCE_GROUPS: readonly (readonly string[])[] = [
  ['jackjcart', 'jackacart'],
  ['tiagohesp', 'tiagihesp'],
  ['kymo', 'kymoone'],
]

function canonicalVendorAlnumKey(alnumKey: string): string {
  for (const group of VENDOR_ALNUM_EQUIVALENCE_GROUPS) {
    if (group.includes(alnumKey)) return group[0]
  }
  return alnumKey
}

/** True when `b`'s tokens are a strict extension of `a`'s (e.g. "kymo" vs "kymo one"). Same length → false (use exact/alnum). */
function vendorTokenPrefixExtension(a: string, b: string): boolean {
  const ta = normalizeExperienceVendorName(a).split(/\s+/).filter(Boolean)
  const tb = normalizeExperienceVendorName(b).split(/\s+/).filter(Boolean)
  if (ta.length === 0 || tb.length === 0 || ta.length === tb.length) return false
  const [shorter, longer] = ta.length < tb.length ? [ta, tb] : [tb, ta]
  for (let i = 0; i < shorter.length; i++) {
    if (shorter[i] !== longer[i]) return false
  }
  return true
}

/**
 * Match two vendor/display strings for filters and spotlight (case, spacing, punctuation, “Kymo” vs “Kymo One”, J.C. vs AC).
 */
export function experienceVendorsLooselyEqual(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  const na = normalizeExperienceVendorName(a)
  const nb = normalizeExperienceVendorName(b)
  if (!na || !nb) return false
  if (na === nb) return true
  if (vendorTokenPrefixExtension(na, nb)) return true
  const aa = canonicalVendorAlnumKey(alnumVendorKey(na))
  const bb = canonicalVendorAlnumKey(alnumVendorKey(nb))
  if (aa.length >= 3 && bb.length >= 3 && aa === bb) return true
  return false
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
  return experienceVendorsLooselyEqual(product.vendor, spotlight.vendorName)
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

/** Early-access list pricing (10% off ladder reference) when spotlight is unlisted and this product is in it. */
export function experienceEarlyAccessForProduct(
  product: ProductLike | null | undefined,
  lampProductId: string,
  spotlight: SpotlightData | null | undefined
): boolean {
  if (!product || product.id === lampProductId || !spotlight?.unlisted) return false
  return productMatchesSpotlight(product, spotlight)
}
