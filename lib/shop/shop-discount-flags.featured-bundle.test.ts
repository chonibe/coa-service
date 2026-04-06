import { computeFeaturedBundleEffectiveUsd } from './shop-discount-flags'

describe('computeFeaturedBundleEffectiveUsd', () => {
  it('fixed_total returns value when enabled', () => {
    expect(
      computeFeaturedBundleEffectiveUsd(200, {
        enabled: true,
        mode: 'fixed_total',
        value: 159,
      })
    ).toBe(159)
  })

  it('percent_off clamps and rounds', () => {
    expect(
      computeFeaturedBundleEffectiveUsd(100, {
        enabled: true,
        mode: 'percent_off',
        value: 10,
      })
    ).toBe(90)
  })

  it('amount_off subtracts from base', () => {
    expect(
      computeFeaturedBundleEffectiveUsd(100, {
        enabled: true,
        mode: 'amount_off',
        value: 15,
      })
    ).toBe(85)
  })

  it('returns regular when disabled', () => {
    expect(
      computeFeaturedBundleEffectiveUsd(175, {
        enabled: false,
        mode: 'fixed_total',
        value: 99,
      })
    ).toBe(175)
  })
})
