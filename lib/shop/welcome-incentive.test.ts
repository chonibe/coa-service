import {
  getWelcomeIncentiveConfig,
  shouldShowWelcomeIncentiveStrip,
} from './welcome-incentive'

describe('welcome-incentive', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    localStorage.clear()
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('defaults to WELCOME10 and disabled', () => {
    delete process.env.NEXT_PUBLIC_WELCOME_PROMO_CODE
    delete process.env.NEXT_PUBLIC_WELCOME_INCENTIVE_ENABLED
    const cfg = getWelcomeIncentiveConfig()
    expect(cfg.code).toBe('WELCOME10')
    expect(cfg.enabled).toBe(false)
    expect(cfg.percentOff).toBe(10)
    expect(shouldShowWelcomeIncentiveStrip()).toBe(false)
  })

  it('respects enabled=1', () => {
    process.env.NEXT_PUBLIC_WELCOME_INCENTIVE_ENABLED = '1'
    expect(getWelcomeIncentiveConfig().enabled).toBe(true)
  })

  it('respects enabled=0', () => {
    process.env.NEXT_PUBLIC_WELCOME_INCENTIVE_ENABLED = '0'
    expect(getWelcomeIncentiveConfig().enabled).toBe(false)
    expect(shouldShowWelcomeIncentiveStrip()).toBe(false)
  })

  it('uses custom code and percent from env', () => {
    process.env.NEXT_PUBLIC_WELCOME_PROMO_CODE = 'hello15'
    process.env.NEXT_PUBLIC_WELCOME_PROMO_PERCENT = '15'
    const cfg = getWelcomeIncentiveConfig()
    expect(cfg.code).toBe('HELLO15')
    expect(cfg.percentOff).toBe(15)
    expect(cfg.headline).toContain('15%')
  })
})
