import type { ShopifyProduct } from '../shopify/storefront-client'
import {
  experienceArtworkUnitUsd,
  normalizeExperienceProductKey,
  type ExperienceArtworkPriceMaps,
} from './experience-artwork-unit-price'

/** Fixed checkout / display subtotal for lamp + first two spotlight prints (before promo). */
export const FEATURED_ARTIST_BUNDLE_USD = 159

export type SpotlightLike = {
  productIds: string[]
}

/**
 * Resolve the first two spotlight catalog products in API order.
 * Prefers `allProducts`, then `productsFromApi`.
 */
export function getSpotlightPairProducts(
  spotlightData: SpotlightLike | null | undefined,
  productsFromApi: ShopifyProduct[],
  allProducts: ShopifyProduct[]
): [ShopifyProduct, ShopifyProduct] | null {
  if (!spotlightData?.productIds?.length || spotlightData.productIds.length < 2) return null

  const id1 = normalizeExperienceProductKey(spotlightData.productIds[0]!)
  const id2 = normalizeExperienceProductKey(spotlightData.productIds[1]!)
  if (!id1 || !id2) return null

  const find = (numericId: string): ShopifyProduct | null => {
    for (const list of [allProducts, productsFromApi]) {
      const hit = list.find((p) => normalizeExperienceProductKey(p.id) === numericId)
      if (hit) return hit
    }
    return null
  }

  const p1 = find(id1)
  const p2 = find(id2)
  if (!p1 || !p2) return null
  if (normalizeExperienceProductKey(p1.id) === normalizeExperienceProductKey(p2.id)) return null
  return [p1, p2]
}

export function isFeaturedArtistBundleActive(args: {
  lampQuantity: number
  cartOrder: string[]
  spotlightProductIds: string[]
  resolveProduct: (productGid: string) => ShopifyProduct | null | undefined
}): boolean {
  if (args.lampQuantity !== 1) return false
  if (args.cartOrder.length !== 2) return false

  const c0 = normalizeExperienceProductKey(args.cartOrder[0]!)
  const c1 = normalizeExperienceProductKey(args.cartOrder[1]!)
  if (!c0 || !c1 || c0 === c1) return false

  const s0 = normalizeExperienceProductKey(args.spotlightProductIds[0] ?? '')
  const s1 = normalizeExperienceProductKey(args.spotlightProductIds[1] ?? '')
  if (!s0 || !s1 || s0 === s1) return false

  const cartSet = new Set([c0, c1])
  const spotSet = new Set([s0, s1])
  if (cartSet.size !== 2 || spotSet.size !== 2) return false
  for (const id of cartSet) {
    if (!spotSet.has(id)) return false
  }

  const pA = args.resolveProduct(args.cartOrder[0]!)
  const pB = args.resolveProduct(args.cartOrder[1]!)
  if (!pA?.availableForSale || !pB?.availableForSale) return false

  return true
}

/**
 * Allocate `targetCents` across `weights.length` lines proportionally; largest remainder for exact cents.
 */
export function allocateUsdByWeights(weights: number[], targetUsd: number): number[] {
  const targetCents = Math.round(targetUsd * 100)
  const n = weights.length
  if (n === 0) return []

  const sumW = weights.reduce((a, b) => a + b, 0)
  if (sumW <= 0) {
    const base = Math.floor(targetCents / n)
    let rem = targetCents - base * n
    return Array.from({ length: n }, (_, i) => {
      const extra = rem > 0 ? 1 : 0
      if (rem > 0) rem--
      return (base + extra) / 100
    })
  }

  const exact = weights.map((w) => (w / sumW) * targetCents)
  const floors = exact.map((x) => Math.floor(x))
  const deficit = targetCents - floors.reduce((a, b) => a + b, 0)
  const order = exact
    .map((x, i) => ({ i, r: x - Math.floor(x) }))
    .sort((a, b) => b.r - a.r)
  const cents = [...floors]
  for (let k = 0; k < deficit && k < order.length; k++) {
    cents[order[k]!.i]++
  }
  return cents.map((c) => c / 100)
}

export type FeaturedBundleCheckoutPrices = {
  lampLineUsd: number[]
  artworkUnitUsdByNumericId: Record<string, number>
}

/**
 * Split {@link FEATURED_ARTIST_BUNDLE_USD} across lamp line(s) + two artwork units using natural prices as weights.
 */
export function computeFeaturedBundleCheckoutPrices(args: {
  lampNaturalLines: number[]
  artProducts: [ShopifyProduct, ShopifyProduct]
  priceMaps?: ExperienceArtworkPriceMaps
}): FeaturedBundleCheckoutPrices {
  const { lampNaturalLines, artProducts, priceMaps } = args
  const lampSum = lampNaturalLines.reduce((a, b) => a + b, 0)
  const u1 = experienceArtworkUnitUsd(artProducts[0], priceMaps)
  const u2 = experienceArtworkUnitUsd(artProducts[1], priceMaps)
  const lineCount = lampNaturalLines.length + 2
  const weights: number[] = [...lampNaturalLines, u1, u2]
  const allocated = allocateUsdByWeights(weights, FEATURED_ARTIST_BUNDLE_USD)

  const lampLineUsd = allocated.slice(0, lampNaturalLines.length)
  const a1 = allocated[lampNaturalLines.length] ?? 0
  const a2 = allocated[lampNaturalLines.length + 1] ?? 0
  const k1 = normalizeExperienceProductKey(artProducts[0].id)
  const k2 = normalizeExperienceProductKey(artProducts[1].id)

  return {
    lampLineUsd,
    artworkUnitUsdByNumericId: {
      [k1]: a1,
      [k2]: a2,
    },
  }
}

/** Non-bundle subtotal: sum of lamp lines + two artwork units (same basis as experience UI). */
export function computeFeaturedBundleRegularSubtotalUsd(args: {
  lampNaturalLines: number[]
  artProducts: [ShopifyProduct, ShopifyProduct]
  priceMaps?: ExperienceArtworkPriceMaps
}): number {
  const lampSum = args.lampNaturalLines.reduce((a, b) => a + b, 0)
  const u1 = experienceArtworkUnitUsd(args.artProducts[0], args.priceMaps)
  const u2 = experienceArtworkUnitUsd(args.artProducts[1], args.priceMaps)
  return lampSum + u1 + u2
}
