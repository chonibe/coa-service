import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import type { EditionStateItem } from '@/lib/shop/query-edition-states'
import { normalizeShopifyProductId } from '@/lib/shop/shopify-product-id'
import {
  getStreetNextPriceBump,
  getStreetPricingStageDisplay,
  streetSeasonFromTotalEditions,
} from '@/lib/shop/street-collector-pricing-stages'
import { getEditionsProgressFromStorefront } from '@/lib/shop/street-edition-from-storefront'

function nextBumpFor(season: 1 | 2, sold: number): EditionStateItem['nextBump'] {
  const bump = getStreetNextPriceBump(season, sold)
  if (!bump) return null
  if (bump.kind === 'price_rise') {
    return {
      kind: 'price_rise',
      nextPriceUsd: bump.nextPriceUsd,
      afterSales: bump.salesUntilBump,
    }
  }
  return { kind: 'edition_end', afterSales: bump.salesUntilBump }
}

function groundFloorDefaults(productId: string): EditionStateItem {
  const season = 2
  const sold = 0
  const display = getStreetPricingStageDisplay(season, sold)
  return {
    productId,
    editionsSold: sold,
    editionTotal: null,
    season,
    stageKey: display.stageKey,
    label: display.label,
    priceUsd: display.priceUsd,
    subcopy: display.subcopy,
    nextBump: nextBumpFor(season, sold),
  }
}

/**
 * Combines Supabase `products` edition counters with Storefront inventory so ladder stages and
 * prices match what collectors see when DB rows are missing or `edition_counter` lags Shopify.
 */
export function mergeEditionStateWithStorefront(
  product: ShopifyProduct,
  db: EditionStateItem | undefined
): EditionStateItem {
  const productId = normalizeShopifyProductId(product.id) || ''
  const sf = getEditionsProgressFromStorefront(product, { seasonBandsFallback: 2 })

  const editionTotal = db?.editionTotal ?? sf?.editionTotal ?? null
  const mergedSold = Math.max(db?.editionsSold ?? 0, sf?.editionsSold ?? 0)

  if (editionTotal == null) {
    if (db) return { ...db, productId: db.productId || productId }
    return groundFloorDefaults(productId)
  }

  const season = streetSeasonFromTotalEditions(editionTotal)
  const display = getStreetPricingStageDisplay(season, mergedSold)
  const bump = getStreetNextPriceBump(season, mergedSold)
  let nextBump: EditionStateItem['nextBump'] = null
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
    productId: db?.productId || productId,
    editionsSold: mergedSold,
    editionTotal,
    season,
    stageKey: display.stageKey,
    label: display.label,
    priceUsd: display.priceUsd,
    subcopy: display.subcopy,
    nextBump,
  }
}
