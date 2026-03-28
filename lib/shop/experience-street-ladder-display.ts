import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import type { StreetEditionStatesRow } from '@/lib/shop/street-edition-states'

/** Whole dollars show without `.00`; fractional amounts keep minimal decimals (e.g. `$43.2`). */
export function formatStreetListUsdDisplay(usd: number): string {
  const x = Math.round(usd * 100) / 100
  if (!Number.isFinite(x)) return '$0'
  const trimmed = x.toFixed(2).replace(/\.?0+$/, '')
  return `$${trimmed}`
}

/**
 * List price for experience UI — ladder `priceUsd` when set, else storefront; early access 10% off reference.
 */
export function formatStreetArtworkListPrice(
  product: ShopifyProduct,
  streetPricing: { priceUsd: number | null } | null | undefined,
  isEarlyAccess: boolean
): { primary: string; compareAt: string | null } {
  const storefront = parseFloat(product.priceRange?.minVariantPrice?.amount ?? '0')
  const ladder =
    streetPricing?.priceUsd != null && streetPricing.priceUsd > 0 ? streetPricing.priceUsd : null
  const reference = ladder ?? storefront
  if (reference <= 0) return { primary: 'Free', compareAt: null }
  if (isEarlyAccess) {
    const discounted = Math.round(reference * 0.9 * 100) / 100
    return {
      primary: formatStreetListUsdDisplay(discounted),
      compareAt: formatStreetListUsdDisplay(reference),
    }
  }
  return { primary: formatStreetListUsdDisplay(reference), compareAt: null }
}

/** Next-step chip: `N more · then $X` or `N more · edition ends` (no “sales” wording). */
export function formatStreetNextSalesChipText(bump: StreetEditionStatesRow['nextBump']): string | null {
  if (!bump) return null
  const n = bump.afterSales
  const prefix = `${n} more`
  if (bump.kind === 'price_rise') {
    return `${prefix} · then $${bump.nextPriceUsd}`
  }
  return `${prefix} · edition ends`
}

export type StreetLadderForScarcity = {
  stageLabel: string
  subcopy: string | null
  listActive: boolean
  listPricePrimary: string
  listPriceCompareAt: string | null
  nextStepChip: string | null
}

export function buildStreetLadderForScarcity(
  product: ShopifyProduct,
  row: StreetEditionStatesRow | null | undefined,
  isEarlyAccess: boolean
): StreetLadderForScarcity | null {
  if (!row) return null
  const listActive = row.priceUsd != null && row.priceUsd > 0
  const { primary, compareAt } = formatStreetArtworkListPrice(product, row, isEarlyAccess)
  return {
    stageLabel: row.label,
    subcopy: row.subcopy || null,
    listActive,
    listPricePrimary: listActive ? primary : '',
    listPriceCompareAt: listActive ? compareAt : null,
    nextStepChip: listActive ? formatStreetNextSalesChipText(row.nextBump) : null,
  }
}
