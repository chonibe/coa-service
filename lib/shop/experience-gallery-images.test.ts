import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { pickInitialPreviewProduct } from './experience-gallery-images'

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
