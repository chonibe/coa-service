import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import {
  EXPERIENCE_LAST_VIEWED_ARTWORK_KEY,
  findProductByLastViewed,
  loadLastViewedArtwork,
  saveLastViewedArtwork,
} from './experience-last-viewed-artwork'

function mockProduct(id: string, handle?: string): ShopifyProduct {
  return {
    id: `gid://shopify/Product/${id}`,
    handle: handle ?? id,
    title: id,
  } as ShopifyProduct
}

describe('experience-last-viewed-artwork', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when nothing is stored', () => {
    expect(loadLastViewedArtwork()).toBeNull()
  })

  it('saves and loads by product id + handle', () => {
    saveLastViewedArtwork(mockProduct('123', 'sunset'))
    expect(loadLastViewedArtwork()).toEqual({
      productId: '123',
      handle: 'sunset',
    })
    expect(localStorage.getItem(EXPERIENCE_LAST_VIEWED_ARTWORK_KEY)).toContain('123')
  })

  it('clears storage when product is null', () => {
    saveLastViewedArtwork(mockProduct('123'))
    saveLastViewedArtwork(null)
    expect(loadLastViewedArtwork()).toBeNull()
  })

  it('finds by normalized product id across pools', () => {
    const a = mockProduct('111', 'a')
    const b = mockProduct('222', 'b')
    const found = findProductByLastViewed({ productId: '222' }, [[a], [b]])
    expect(found?.id).toBe(b.id)
  })

  it('falls back to handle when id is missing from pools', () => {
    const a = mockProduct('111', 'sunset')
    const found = findProductByLastViewed(
      { productId: '999', handle: 'sunset' },
      [[a]]
    )
    expect(found?.handle).toBe('sunset')
  })

  it('returns null when no match', () => {
    expect(
      findProductByLastViewed({ productId: '404', handle: 'missing' }, [[mockProduct('1')]])
    ).toBeNull()
  })
})
