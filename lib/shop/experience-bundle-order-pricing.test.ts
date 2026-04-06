import type { ShopifyProduct } from '../shopify/storefront-client'
import { computeExperienceFeaturedBundlePricing } from './experience-bundle-order-pricing'
import { DEFAULT_FEATURED_BUNDLE_DISCOUNT_SETTINGS } from './shop-discount-flags'

function mockProduct(
  id: string,
  opts: Partial<{ price: number }> = {}
): ShopifyProduct {
  const price = String(opts.price ?? 50)
  const z = { amount: price, currencyCode: 'USD' as const }
  return {
    id,
    handle: 'h',
    title: 'T',
    description: '',
    descriptionHtml: '',
    vendor: 'V',
    productType: '',
    tags: [],
    availableForSale: true,
    priceRange: { minVariantPrice: z, maxVariantPrice: z },
    compareAtPriceRange: { minVariantPrice: z, maxVariantPrice: z },
    featuredImage: null,
    images: { edges: [] },
    variants: { edges: [] },
    options: [],
    metafields: null,
  }
}

describe('computeExperienceFeaturedBundlePricing', () => {
  const lamp = mockProduct('gid://shopify/Product/LAMP', { price: 100 })
  const a = mockProduct('gid://shopify/Product/1', { price: 40 })
  const b = mockProduct('gid://shopify/Product/2', { price: 40 })
  const extra = mockProduct('gid://shopify/Product/99', { price: 25 })

  it('adds natural price for extra artworks when bundle applies', () => {
    const cartOrder = [a.id, b.id, extra.id]
    const selectedProducts = [a, b, extra]
    const r = computeExperienceFeaturedBundlePricing({
      lampQuantity: 1,
      lampPrices: [100],
      cartOrder,
      spotlightProductIds: ['1', '2'],
      spotlightPairProducts: [a, b],
      resolveProduct: (gid) => selectedProducts.find((p) => p.id === gid),
      priceMaps: undefined,
      selectedProducts,
      featuredBundle: DEFAULT_FEATURED_BUNDLE_DISCOUNT_SETTINGS,
    })
    expect(r.pricingActive).toBe(true)
    expect([...r.bundlePricedArtworkIndices].sort()).toEqual([0, 1])
    expect(r.orderTotalUsd).toBe(159 + 25)
  })

  it('does not apply when bundle disabled in settings', () => {
    const cartOrder = [a.id, b.id]
    const selectedProducts = [a, b]
    const r = computeExperienceFeaturedBundlePricing({
      lampQuantity: 1,
      lampPrices: [100],
      cartOrder,
      spotlightProductIds: ['1', '2'],
      spotlightPairProducts: [a, b],
      resolveProduct: (gid) => selectedProducts.find((p) => p.id === gid),
      priceMaps: undefined,
      selectedProducts,
      featuredBundle: { ...DEFAULT_FEATURED_BUNDLE_DISCOUNT_SETTINGS, enabled: false },
    })
    expect(r.pricingActive).toBe(false)
    expect(r.orderTotalUsd).toBe(180)
  })
})
