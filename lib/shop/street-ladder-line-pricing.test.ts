import {
  applyStreetLadderUsdToLineItems,
  resolveCheckoutLineUsdItems,
} from '@/lib/shop/street-ladder-line-pricing'

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

describe('resolveCheckoutLineUsdItems', () => {
  it('applies reserve lock before ladder', () => {
    const out = resolveCheckoutLineUsdItems(
      [{ productId: '123', price: 10, quantity: 1 }],
      {
        lockedUsdByNumericProductId: { '123': 25 },
        ladderUsdByNumericProductId: { '123': 99 },
      }
    )
    expect(out[0].price).toBe(25)
  })

  it('keeps client price when priceBasis is client even if ladder exists', () => {
    const out = resolveCheckoutLineUsdItems(
      [{ productId: '123', price: 40, quantity: 1, priceBasis: 'client' }],
      {
        lockedUsdByNumericProductId: {},
        ladderUsdByNumericProductId: { '123': 55 },
      }
    )
    expect(out[0].price).toBe(40)
  })

  it('uses ladder when no lock and not client-priced', () => {
    const out = resolveCheckoutLineUsdItems(
      [{ productId: '456', price: 10, quantity: 1 }],
      {
        lockedUsdByNumericProductId: {},
        ladderUsdByNumericProductId: { '456': 48 },
      }
    )
    expect(out[0].price).toBe(48)
  })

  it('keeps request price when no ladder row', () => {
    const out = resolveCheckoutLineUsdItems(
      [{ productId: '999', price: 33.5, quantity: 1 }],
      {
        lockedUsdByNumericProductId: {},
        ladderUsdByNumericProductId: {},
      }
    )
    expect(out[0].price).toBe(33.5)
  })
})
