import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import type { StreetEditionStatesRow } from '@/lib/shop/street-edition-states'
import {
  getStreetNextPriceBump,
  getStreetPricingStageDisplay,
  streetSeasonFromTotalEditions,
} from '@/lib/shop/street-collector-pricing-stages'

function parseEditionSizeMetafield(product: ShopifyProduct): number | null {
  const m = product.metafields?.find(
    (f) => f != null && f.namespace === 'custom' && f.key === 'edition_size'
  )
  if (!m?.value) return null
  const n = parseInt(String(m.value).replace(/\D/g, ''), 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Sum `quantityAvailable` across variants; `null` if nothing looks inventory-tracked. */
function totalQuantityAvailable(product: ShopifyProduct): number | null {
  const edges = product.variants?.edges ?? []
  if (edges.length === 0) return null
  let sum = 0
  let any = false
  for (const e of edges) {
    const q = e.node?.quantityAvailable
    if (q != null && Number.isFinite(Number(q))) {
      any = true
      sum += Math.max(0, Math.floor(Number(q)))
    }
  }
  return any ? sum : null
}

function editionsSoldFromInventory(editionTotal: number, qtyLeft: number | null): number | null {
  if (qtyLeft === null) return null
  return Math.max(0, Math.min(editionTotal, editionTotal - qtyLeft))
}

/**
 * When `GET /api/shop/edition-states` has no Supabase row, derive ladder copy from Storefront
 * `custom.edition_size` + remaining variant inventory (same rules as the API route).
 */
export function streetEditionRowFromStorefrontProduct(
  product: ShopifyProduct,
  options?: { seasonBandsFallback?: 1 | 2 }
): StreetEditionStatesRow | null {
  const metafieldTotal = parseEditionSizeMetafield(product)
  const qtyLeft = totalQuantityAvailable(product)

  let editionTotal: number | null = metafieldTotal
  if (editionTotal == null && options?.seasonBandsFallback != null) {
    if (qtyLeft === null) return null
    editionTotal = options.seasonBandsFallback === 2 ? 44 : 90
  }
  if (editionTotal == null) return null

  let sold: number | null
  if (metafieldTotal != null) {
    sold = editionsSoldFromInventory(editionTotal, qtyLeft)
    if (sold === null) sold = 0
  } else {
    sold = editionsSoldFromInventory(editionTotal, qtyLeft)
    if (sold === null) return null
  }

  const season = streetSeasonFromTotalEditions(editionTotal)
  const display = getStreetPricingStageDisplay(season, sold)
  const bump = getStreetNextPriceBump(season, sold)

  let nextBump: StreetEditionStatesRow['nextBump'] = null
  if (bump) {
    if (bump.kind === 'price_rise') {
      nextBump = {
        kind: 'price_rise',
        nextPriceUsd: bump.nextPriceUsd,
        afterSales: bump.salesUntilBump,
      }
    } else {
      nextBump = { kind: 'edition_end', afterSales: bump.salesUntilBump }
    }
  }

  return {
    stageKey: display.stageKey,
    label: display.label,
    priceUsd: display.priceUsd,
    subcopy: display.subcopy,
    nextBump,
  }
}
