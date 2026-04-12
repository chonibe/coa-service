import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { resolveArtworkDetailProduct } from './resolve-artwork-detail-product'

function stubProduct(id: string, handle: string): ShopifyProduct {
  const z = { amount: '0', currencyCode: 'USD' as const }
  return {
    id,
    handle,
    title: 'T',
    description: '',
    descriptionHtml: '',
    vendor: '',
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

describe('resolveArtworkDetailProduct', () => {
  it('returns list product when full is null', () => {
    const list = stubProduct('gid://shopify/Product/111', 'a')
    expect(resolveArtworkDetailProduct(list, null)).toBe(list)
  })

  it('returns full when ids match (gid vs numeric)', () => {
    const list = stubProduct('gid://shopify/Product/111', 'a')
    const full = stubProduct('111', 'a')
    full.media = { edges: [] }
    expect(resolveArtworkDetailProduct(list, full)).toBe(full)
  })

  it('ignores stale full from another product', () => {
    const list = stubProduct('gid://shopify/Product/111', 'a')
    const stale = stubProduct('gid://shopify/Product/999', 'b')
    stale.media = { edges: [{ node: {} as never }] }
    expect(resolveArtworkDetailProduct(list, stale)).toBe(list)
  })
})
