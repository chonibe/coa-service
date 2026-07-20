import {
  isLandingPath,
  LANDING_ANALYTICS_DEFER_MS,
  LANDING_PATHS,
} from './landing-paths'

describe('landing-paths', () => {
  it('exports a 10s defer constant for marketing routes', () => {
    expect(LANDING_ANALYTICS_DEFER_MS).toBe(10_000)
  })

  it('matches root and experience landing paths', () => {
    expect(isLandingPath('/')).toBe(true)
    expect(isLandingPath('/shop/experience')).toBe(true)
    expect(isLandingPath('/shop/experience/')).toBe(true)
    expect(isLandingPath('/shop/street-collector')).toBe(true)
    expect(isLandingPath('/experience')).toBe(true)
  })

  it('does not match nested shop routes outside landing list', () => {
    expect(isLandingPath('/shop/cart')).toBe(false)
    expect(isLandingPath('/vendor/dashboard')).toBe(false)
    expect(isLandingPath(null)).toBe(false)
  })

  it('lists all configured landing paths', () => {
    expect(LANDING_PATHS).toEqual([
      '/',
      '/shop/street-collector',
      '/shop/experience',
      '/experience',
    ])
  })
})
