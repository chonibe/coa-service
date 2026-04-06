import { parseShopifyCollectionReference } from './parse-shopify-collection-url'

describe('parseShopifyCollectionReference', () => {
  it('parses admin.shopify.com collection id', () => {
    expect(
      parseShopifyCollectionReference(
        'https://admin.shopify.com/store/thestreetlamp-1/collections/686811218306',
      ),
    ).toEqual({ kind: 'id', id: '686811218306' })
  })

  it('parses raw numeric id', () => {
    expect(parseShopifyCollectionReference('686811218306')).toEqual({ kind: 'id', id: '686811218306' })
  })

  it('parses myshopify admin path', () => {
    expect(parseShopifyCollectionReference('https://x.myshopify.com/admin/collections/123')).toEqual({
      kind: 'id',
      id: '123',
    })
  })

  it('parses storefront collection handle', () => {
    expect(parseShopifyCollectionReference('https://shop.example.com/collections/saturn-png')).toEqual({
      kind: 'handle',
      handle: 'saturn-png',
    })
  })
})
