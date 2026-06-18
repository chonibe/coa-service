import {
  cartEditionHoldExpiresAt,
  computeReservedEditionNumber,
  formatCartEditionHoldEditionLabel,
  isCartEditionHoldActive,
  resolveCartEditionHoldDisplayNumber,
  resolveCartEditionHoldEditionNumber,
  resolveCartEditionHoldExpiresAt,
} from './compute-cart-edition-reserve'
import { CART_EDITION_HOLD_TTL_MS } from './cart-edition-hold-config'

describe('computeReservedEditionNumber', () => {
  it('returns sold + 1 when no other holds', () => {
    expect(computeReservedEditionNumber(5, 0)).toBe(6)
  })

  it('queues behind other active holds', () => {
    expect(computeReservedEditionNumber(5, 2)).toBe(8)
  })

  it('starts at 2 when first edition is internally reserved and none sold yet', () => {
    expect(computeReservedEditionNumber(0, 0, { firstEditionReserved: true })).toBe(2)
  })
})

describe('cartEditionHoldExpiresAt', () => {
  it('is 24 hours after anchor', () => {
    const from = Date.UTC(2026, 5, 18, 12, 0, 0)
    const expires = Date.parse(cartEditionHoldExpiresAt(from))
    expect(expires - from).toBe(CART_EDITION_HOLD_TTL_MS)
  })
})

describe('isCartEditionHoldActive', () => {
  it('is false after expiry', () => {
    const now = Date.UTC(2026, 5, 19, 12, 0, 0)
    const expiresAt = new Date(now - 1000).toISOString()
    expect(isCartEditionHoldActive(expiresAt, now)).toBe(false)
  })
})

describe('resolveCartEditionHoldExpiresAt', () => {
  const now = Date.UTC(2026, 5, 18, 12, 0, 0)

  it('preserves active existing expiry on resync', () => {
    const existing = new Date(now + 20 * 3600000).toISOString()
    expect(resolveCartEditionHoldExpiresAt(existing, now)).toBe(existing)
  })

  it('starts fresh 24h when no existing hold', () => {
    const expires = Date.parse(resolveCartEditionHoldExpiresAt(null, now))
    expect(expires - now).toBe(CART_EDITION_HOLD_TTL_MS)
  })

  it('starts fresh 24h when previous hold expired', () => {
    const expired = new Date(now - 1000).toISOString()
    const expires = Date.parse(resolveCartEditionHoldExpiresAt(expired, now))
    expect(expires - now).toBe(CART_EDITION_HOLD_TTL_MS)
  })
})

describe('resolveCartEditionHoldEditionNumber', () => {
  const now = Date.UTC(2026, 5, 18, 12, 0, 0)
  const activeExpiry = new Date(now + 20 * 3600000).toISOString()
  const expiredExpiry = new Date(now - 1000).toISOString()

  it('preserves assigned edition on active resync', () => {
    expect(resolveCartEditionHoldEditionNumber(7, 12, activeExpiry, now)).toBe(7)
  })

  it('recomputes when hold expired', () => {
    expect(resolveCartEditionHoldEditionNumber(7, 12, expiredExpiry, now)).toBe(12)
  })

  it('recomputes when edition was not yet assigned', () => {
    expect(resolveCartEditionHoldEditionNumber(null, 12, activeExpiry, now)).toBe(12)
  })
})

describe('resolveCartEditionHoldDisplayNumber', () => {
  it('prefers hold edition number', () => {
    expect(resolveCartEditionHoldDisplayNumber({ editionNumber: 12 }, 5)).toBe(12)
  })

  it('falls back when hold has no edition', () => {
    expect(resolveCartEditionHoldDisplayNumber({ editionNumber: null }, 7)).toBe(7)
  })

  it('returns null when neither is available', () => {
    expect(resolveCartEditionHoldDisplayNumber({ editionNumber: null }, null)).toBeNull()
  })
})

describe('formatCartEditionHoldEditionLabel', () => {
  it('formats numbered edition', () => {
    expect(formatCartEditionHoldEditionLabel(12)).toBe('Edition #12')
  })

  it('uses generic label when number unknown', () => {
    expect(formatCartEditionHoldEditionLabel(null)).toBe('Edition')
  })
})
