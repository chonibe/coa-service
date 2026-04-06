import {
  buildStripeCheckoutShippingOptions,
  FREE_SHIPPING_THRESHOLD_CENTS,
} from './stripe-checkout-shipping'

describe('buildStripeCheckoutShippingOptions', () => {
  it('toggle off: always free standard then express', () => {
    const opts = buildStripeCheckoutShippingOptions(1000, false)
    expect(opts).toHaveLength(2)
    expect(opts[0].shipping_rate_data.fixed_amount?.amount).toBe(0)
    expect(opts[0].shipping_rate_data.display_name).toBe('Free shipping')
    expect(opts[1].shipping_rate_data.fixed_amount?.amount).toBe(1500)
    expect(opts[1].shipping_rate_data.display_name).toBe('Express shipping')
  })

  it('toggle off: still free standard above threshold', () => {
    const opts = buildStripeCheckoutShippingOptions(FREE_SHIPPING_THRESHOLD_CENTS + 100, false)
    expect(opts[0].shipping_rate_data.fixed_amount?.amount).toBe(0)
  })

  it('toggle on below $70: $10 standard then express', () => {
    const opts = buildStripeCheckoutShippingOptions(6999, true)
    expect(opts[0].shipping_rate_data.fixed_amount?.amount).toBe(1000)
    expect(opts[0].shipping_rate_data.display_name).toBe('Standard shipping')
    expect(opts[1].shipping_rate_data.fixed_amount?.amount).toBe(1500)
  })

  it('toggle on at exactly $70: free standard', () => {
    const opts = buildStripeCheckoutShippingOptions(FREE_SHIPPING_THRESHOLD_CENTS, true)
    expect(opts[0].shipping_rate_data.fixed_amount?.amount).toBe(0)
    expect(opts[0].shipping_rate_data.display_name).toBe('Free shipping')
  })

  it('toggle on above $70: free standard', () => {
    const opts = buildStripeCheckoutShippingOptions(50_000, true)
    expect(opts[0].shipping_rate_data.fixed_amount?.amount).toBe(0)
  })

  it('treats non-finite subtotal as 0 when tiered', () => {
    const opts = buildStripeCheckoutShippingOptions(NaN, true)
    expect(opts[0].shipping_rate_data.fixed_amount?.amount).toBe(1000)
  })
})
