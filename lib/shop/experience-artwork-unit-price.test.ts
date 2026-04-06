import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { experienceArtworkUnitUsd } from '@/lib/shop/experience-artwork-unit-price'

describe('experienceArtworkUnitUsd', () => {
  it('falls back to Storefront ladder when API map has no row (picker parity)', () => {
    const product = {
      id: 'gid://shopify/Product/999999999',
      handle: 'test-creature',
      title: 'Creature',
      availableForSale: true,
      priceRange: {
        minVariantPrice: { amount: '43', currencyCode: 'USD' },
        maxVariantPrice: { amount: '43', currencyCode: 'USD' },
      },
      metafields: [{ namespace: 'custom', key: 'edition_size', value: '90' }],
      variants: {
        edges: [{ node: { id: 'gid://shopify/ProductVariant/1', quantityAvailable: 90 } }],
      },
    } as unknown as ShopifyProduct

    const usd = experienceArtworkUnitUsd(product, { streetLadderUsdByProductId: {} })
    expect(usd).toBe(40)
  })
})
