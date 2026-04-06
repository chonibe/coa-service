import type { ShopifyProduct } from '../shopify/storefront-client'
import { experienceArtworkUnitUsd, type ExperienceArtworkPriceMaps } from './experience-artwork-unit-price'
import {
  computeFeaturedBundleCheckoutPrices,
  computeFeaturedBundleRegularSubtotalUsd,
  getFeaturedBundleConsumedCartIndices,
  isFeaturedArtistBundleEligible,
  type FeaturedBundleCheckoutPrices,
} from './experience-featured-bundle'
import {
  computeFeaturedBundleEffectiveUsd,
  type FeaturedBundleDiscountSettings,
} from './shop-discount-flags'

export type ExperienceFeaturedBundlePricingInput = {
  lampQuantity: number
  lampPrices: number[]
  cartOrder: string[]
  spotlightProductIds: string[]
  spotlightPairProducts: [ShopifyProduct, ShopifyProduct] | null
  resolveProduct: (gid: string) => ShopifyProduct | null | undefined
  priceMaps: ExperienceArtworkPriceMaps | undefined
  selectedProducts: ShopifyProduct[]
  featuredBundle: FeaturedBundleDiscountSettings
}

export type ExperienceFeaturedBundlePricingResult = {
  eligible: boolean
  pricingActive: boolean
  consumedCartIndices: [number, number] | null
  bundlePricedArtworkIndices: Set<number>
  naturalBundleSubtotalUsd: number
  effectiveBundleUsd: number
  extrasArtworksSubtotalUsd: number
  orderTotalUsd: number
  featuredBundleCheckout: FeaturedBundleCheckoutPrices | null
}

/**
 * Featured spotlight bundle: first unit of each spotlight print is priced inside the bundle total; additional copies bill at natural experience prices.
 */
export function computeExperienceFeaturedBundlePricing(
  input: ExperienceFeaturedBundlePricingInput
): ExperienceFeaturedBundlePricingResult {
  const {
    lampQuantity,
    lampPrices,
    cartOrder,
    spotlightProductIds,
    spotlightPairProducts,
    resolveProduct,
    priceMaps,
    selectedProducts,
    featuredBundle,
  } = input

  const lampSum = lampPrices.reduce((a, b) => a + b, 0)
  const naturalArtworksTotal = selectedProducts.reduce(
    (s, p) => s + experienceArtworkUnitUsd(p, priceMaps),
    0
  )
  const fullNaturalTotal = lampSum + naturalArtworksTotal

  const eligible = isFeaturedArtistBundleEligible({
    lampQuantity,
    cartOrder,
    spotlightProductIds,
    resolveProduct,
  })

  const consumed = getFeaturedBundleConsumedCartIndices(cartOrder, spotlightProductIds)
  const pricingActive =
    eligible &&
    featuredBundle.enabled &&
    Boolean(spotlightPairProducts) &&
    consumed !== null

  if (!pricingActive) {
    return {
      eligible,
      pricingActive: false,
      consumedCartIndices: consumed,
      bundlePricedArtworkIndices: new Set(),
      naturalBundleSubtotalUsd: 0,
      effectiveBundleUsd: 0,
      extrasArtworksSubtotalUsd: 0,
      orderTotalUsd: fullNaturalTotal,
      featuredBundleCheckout: null,
    }
  }

  const [ia, ib] = consumed!
  const pair = spotlightPairProducts!

  const naturalBundleSubtotalUsd = computeFeaturedBundleRegularSubtotalUsd({
    lampNaturalLines: lampPrices,
    artProducts: pair,
    priceMaps,
  })

  const effectiveBundleUsd = computeFeaturedBundleEffectiveUsd(naturalBundleSubtotalUsd, featuredBundle)

  let extrasArtworksSubtotalUsd = 0
  for (let i = 0; i < cartOrder.length; i++) {
    if (i === ia || i === ib) continue
    const p = selectedProducts[i]
    if (p) extrasArtworksSubtotalUsd += experienceArtworkUnitUsd(p, priceMaps)
  }

  const bundlePricedArtworkIndices = new Set<number>([ia, ib])

  const featuredBundleCheckout = computeFeaturedBundleCheckoutPrices({
    lampNaturalLines: lampPrices,
    artProducts: pair,
    priceMaps,
    targetBundleUsd: effectiveBundleUsd,
  })

  const orderTotalUsd = effectiveBundleUsd + extrasArtworksSubtotalUsd

  return {
    eligible,
    pricingActive: true,
    consumedCartIndices: consumed,
    bundlePricedArtworkIndices,
    naturalBundleSubtotalUsd,
    effectiveBundleUsd,
    extrasArtworksSubtotalUsd,
    orderTotalUsd,
    featuredBundleCheckout,
  }
}
