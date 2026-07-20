import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import {
  getAdjacentGalleryIndices,
  getDefaultGalleryIndex,
  getGalleryHeroImageUrlsAtWidth,
  pickInitialPreviewProduct,
} from './experience-gallery-images'

function mockProduct(
  id: string,
  opts: { availableForSale?: boolean } = {}
): ShopifyProduct {
  return {
    id,
    handle: id,
    title: id,
    availableForSale: opts.availableForSale ?? true,
  } as ShopifyProduct
}

describe('getAdjacentGalleryIndices', () => {
  it('returns empty for zero length', () => {
    expect(getAdjacentGalleryIndices(0, 0)).toEqual([])
  })

  it('returns only index 0 for a single image', () => {
    expect(getAdjacentGalleryIndices(0, 1)).toEqual([0])
  })

  it('prefetches immediate prev/next without current by default', () => {
    expect(getAdjacentGalleryIndices(2, 5)).toEqual([0, 1, 3, 4])
  })

  it('includes current when requested (LCP bootstrap)', () => {
    expect(getAdjacentGalleryIndices(2, 5, { includeCurrent: true })).toEqual([0, 1, 2, 3, 4])
  })

  it('wraps at gallery ends', () => {
    expect(getAdjacentGalleryIndices(0, 4, { lookahead: 0 })).toEqual([1, 3])
    expect(getAdjacentGalleryIndices(3, 4, { lookahead: 0 })).toEqual([0, 2])
  })

  it('respects lookahead 0 (immediate neighbors only)', () => {
    expect(getAdjacentGalleryIndices(2, 5, { lookahead: 0 })).toEqual([1, 3])
  })
})

describe('getGalleryHeroImageUrlsAtWidth', () => {
  it('builds sized CDN URLs and dedupes', () => {
    const images = [
      { url: 'https://cdn.shopify.com/a.jpg', altText: 'a', width: null, height: null },
      { url: 'https://cdn.shopify.com/b.jpg', altText: 'b', width: null, height: null },
    ]
    const urls = getGalleryHeroImageUrlsAtWidth(images, [0, 1, 0], 480)
    expect(urls).toEqual([
      'https://cdn.shopify.com/a_480x.jpg',
      'https://cdn.shopify.com/b_480x.jpg',
    ])
  })
})

describe('pickInitialPreviewProduct', () => {
  it('returns null when both seasons are empty', () => {
    expect(pickInitialPreviewProduct([], [])).toBeNull()
  })

  it('prefers season 2 pool over season 1', () => {
    const s1 = [mockProduct('s1-a'), mockProduct('s1-b')]
    const s2 = [mockProduct('s2-a'), mockProduct('s2-b')]
    const picked = pickInitialPreviewProduct(s1, s2, () => 0)
    expect(picked?.id).toBe('s2-a')
  })

  it('falls back to season 1 when season 2 is empty', () => {
    const s1 = [mockProduct('s1-a'), mockProduct('s1-b')]
    const picked = pickInitialPreviewProduct(s1, [], () => 0.99)
    expect(picked?.id).toBe('s1-b')
  })

  it('picks uniformly via the random index', () => {
    const s2 = [mockProduct('a'), mockProduct('b'), mockProduct('c')]
    expect(pickInitialPreviewProduct([], s2, () => 0)?.id).toBe('a')
    expect(pickInitialPreviewProduct([], s2, () => 0.34)?.id).toBe('b')
    expect(pickInitialPreviewProduct([], s2, () => 0.67)?.id).toBe('c')
  })

  it('prefers purchasable products when any exist', () => {
    const s2 = [
      mockProduct('sold-out', { availableForSale: false }),
      mockProduct('in-stock', { availableForSale: true }),
      mockProduct('also-sold', { availableForSale: false }),
    ]
    const picked = pickInitialPreviewProduct([], s2, () => 0)
    expect(picked?.id).toBe('in-stock')
  })

  it('falls back to the full pool when nothing is purchasable', () => {
    const s2 = [
      mockProduct('a', { availableForSale: false }),
      mockProduct('b', { availableForSale: false }),
    ]
    expect(pickInitialPreviewProduct([], s2, () => 0.6)?.id).toBe('b')
  })
})
