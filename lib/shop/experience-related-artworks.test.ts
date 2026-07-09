import type { ShopifyProduct } from '../shopify/storefront-client'
import { buildExperienceRelatedArtworkSlider } from './experience-related-artworks'

function mockProduct(
  id: string,
  opts: Partial<{ vendor: string; tags: string[]; title: string }> = {}
): ShopifyProduct {
  const z = { amount: '40', currencyCode: 'USD' as const }
  return {
    id,
    handle: id,
    title: opts.title ?? id,
    description: '',
    descriptionHtml: '',
    vendor: opts.vendor ?? 'Artist A',
    productType: '',
    tags: opts.tags ?? [],
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

describe('buildExperienceRelatedArtworkSlider', () => {
  const lamp = mockProduct('lamp', { vendor: 'Street Collector', title: 'Lamp' })
  const current = mockProduct('a1', { vendor: 'Jane Doe', tags: ['abstract', 'neon'] })
  const sameArtist = mockProduct('a2', { vendor: 'Jane Doe', tags: ['portrait'] })
  const similar = mockProduct('b1', { vendor: 'Other', tags: ['abstract', 'urban'] })
  const unrelated = mockProduct('c1', { vendor: 'Other', tags: ['ceramic'] })

  it('puts current first then same artist then similar tags', () => {
    const items = buildExperienceRelatedArtworkSlider({
      current,
      catalog: [current, sameArtist, similar, unrelated, lamp],
      lampProductId: lamp.id,
      artistVendor: 'Jane Doe',
      limit: 8,
    })
    expect(items[0]?.product.id).toBe('a1')
    expect(items[0]?.reason).toBe('current')
    expect(items.some((i) => i.product.id === 'a2' && i.reason === 'same_artist')).toBe(true)
    expect(items.some((i) => i.product.id === 'b1' && i.reason === 'similar_tags')).toBe(true)
    expect(items.some((i) => i.product.id === 'c1')).toBe(false)
  })

  it('artistOnly excludes similar-tag picks from other vendors', () => {
    const items = buildExperienceRelatedArtworkSlider({
      current,
      catalog: [current, sameArtist, similar, unrelated, lamp],
      lampProductId: lamp.id,
      artistVendor: 'Jane Doe',
      artistOnly: true,
      limit: 8,
    })
    expect(items.some((i) => i.product.id === 'b1')).toBe(false)
    expect(items.some((i) => i.product.id === 'a2')).toBe(true)
  })
})
