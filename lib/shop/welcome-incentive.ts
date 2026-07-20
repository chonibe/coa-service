/**
 * First-purchase welcome incentive (email capture → promo code reveal).
 * Code must exist as an active Stripe Promotion Code for checkout to apply it.
 *
 * Merchant setup:
 * 1. Stripe Dashboard → Products → Coupons → create % off coupon (e.g. 10%).
 * 2. Create a Promotion Code with customer-facing code matching
 *    `NEXT_PUBLIC_WELCOME_PROMO_CODE` (default WELCOME10).
 * 3. Optionally set `NEXT_PUBLIC_WELCOME_PROMO_PERCENT` to match coupon % for copy.
 * 4. Set `NEXT_PUBLIC_WELCOME_INCENTIVE_ENABLED=1` to show the strip (off by default).
 */

export type WelcomeIncentiveConfig = {
  /** When false, UI hides the offer (still safe to call helpers). */
  enabled: boolean
  /** Stripe promotion code customers redeem (e.g. WELCOME10). */
  code: string
  /** Marketing percent for copy only — Stripe coupon is source of truth at checkout. */
  percentOff: number
  headline: string
  shortPitch: string
  ctaLabel: string
  successHint: string
  /** localStorage key once the visitor dismissed the soft strip. */
  dismissStorageKey: string
  /** localStorage key once they claimed / saw the code. */
  claimedStorageKey: string
}

const DEFAULT_CODE = 'WELCOME10'
const DEFAULT_PERCENT = 10

export function getWelcomeIncentiveConfig(): WelcomeIncentiveConfig {
  const code =
    process.env.NEXT_PUBLIC_WELCOME_PROMO_CODE?.trim().toUpperCase() || DEFAULT_CODE
  const percentRaw = Number(process.env.NEXT_PUBLIC_WELCOME_PROMO_PERCENT)
  const percentOff =
    Number.isFinite(percentRaw) && percentRaw > 0 && percentRaw < 100
      ? Math.round(percentRaw)
      : DEFAULT_PERCENT
  const enabledEnv = process.env.NEXT_PUBLIC_WELCOME_INCENTIVE_ENABLED
  // Off by default — set NEXT_PUBLIC_WELCOME_INCENTIVE_ENABLED=1 to show.
  const enabled = enabledEnv === '1' || enabledEnv === 'true'

  return {
    enabled,
    code,
    percentOff,
    headline: `${percentOff}% off your first order`,
    shortPitch: 'Join the list for your code.',
    ctaLabel: `Get ${percentOff}% off`,
    successHint: 'Use it at checkout.',
    dismissStorageKey: 'sc_welcome_incentive_dismissed',
    claimedStorageKey: 'sc_welcome_incentive_claimed',
  }
}

function readFlag(key: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function writeFlag(key: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, '1')
  } catch {
    // private mode / quota
  }
}

export function isWelcomeIncentiveDismissed(config: WelcomeIncentiveConfig = getWelcomeIncentiveConfig()): boolean {
  return readFlag(config.dismissStorageKey)
}

export function isWelcomeIncentiveClaimed(config: WelcomeIncentiveConfig = getWelcomeIncentiveConfig()): boolean {
  return readFlag(config.claimedStorageKey)
}

export function dismissWelcomeIncentive(config: WelcomeIncentiveConfig = getWelcomeIncentiveConfig()): void {
  writeFlag(config.dismissStorageKey)
}

export function markWelcomeIncentiveClaimed(config: WelcomeIncentiveConfig = getWelcomeIncentiveConfig()): void {
  writeFlag(config.claimedStorageKey)
}

/** Show soft strip until dismissed or claimed. */
export function shouldShowWelcomeIncentiveStrip(
  config: WelcomeIncentiveConfig = getWelcomeIncentiveConfig()
): boolean {
  if (!config.enabled) return false
  if (isWelcomeIncentiveDismissed(config)) return false
  if (isWelcomeIncentiveClaimed(config)) return false
  return true
}
