import { applyStreetLadderUsdToLineItems } from '@/lib/shop/street-ladder-line-pricing'

describe('applyStreetLadderUsdToLineItems', () => {
  it('replaces price when ladder has numeric id key', () => {
    const out = applyStreetLadderUsdToLineItems(
      [
        { productId: 'gid://shopify/Product/123', price: 99 },
        { productId: '456', price: 10 },
      ],
      { '123': 48, '456': 44 }
    )
    expect(out[0].price).toBe(48)
    expect(out[1].price).toBe(44)
  })

  it('keeps cart price when product not in ladder map', () => {
    const out = applyStreetLadderUsdToLineItems(
      [{ productId: 'gid://shopify/Product/999', price: 55 }],
      { '123': 40 }
    )
    expect(out[0].price).toBe(55)
  })
})
