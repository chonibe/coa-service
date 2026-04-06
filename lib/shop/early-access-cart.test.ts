import { computeEarlyAccessCartDiscount } from './early-access-cart'

describe('computeEarlyAccessCartDiscount', () => {
  it('returns 10% of subtotal when cookie active and no promo', () => {
    expect(
      computeEarlyAccessCartDiscount(100, 0, { cookieActive: true, promoCodeEntered: false })
    ).toBe(10)
  })

  it('returns 10% of amount after credits', () => {
    expect(
      computeEarlyAccessCartDiscount(100, 25, { cookieActive: true, promoCodeEntered: false })
    ).toBe(7.5)
  })

  it('returns 0 when promo code entered (matches checkout precedence)', () => {
    expect(
      computeEarlyAccessCartDiscount(100, 0, { cookieActive: true, promoCodeEntered: true })
    ).toBe(0)
  })

  it('returns 0 when cookie inactive', () => {
    expect(
      computeEarlyAccessCartDiscount(100, 0, { cookieActive: false, promoCodeEntered: false })
    ).toBe(0)
  })
})
