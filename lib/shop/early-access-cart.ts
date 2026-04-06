import {
  EARLY_ACCESS_COUPON_COOKIE,
  EARLY_ACCESS_CART_REFRESH_EVENT,
  EARLY_ACCESS_DISCOUNT_PERCENT,
} from '@/lib/early-access-constants'

/**
 * True when the early-access promotion code cookie is present (non-empty).
 */
export function readEarlyAccessCouponPresent(): boolean {
  if (typeof document === 'undefined') return false
  const prefix = `${EARLY_ACCESS_COUPON_COOKIE}=`
  for (const part of document.cookie.split(';')) {
    const s = part.trim()
    if (s.startsWith(prefix)) {
      const raw = s.slice(prefix.length)
      try {
        return !!decodeURIComponent(raw).trim()
      } catch {
        return !!raw.trim()
      }
    }
  }
  return false
}

/**
 * Estimated early-access discount in USD for cart/checkout summary.
 * Mirrors checkout: 10% off the card-charge base (subtotal minus credits), and not stacked with a typed promo code.
 */
export function computeEarlyAccessCartDiscount(
  subtotal: number,
  creditsDiscountDollars: number,
  options: { cookieActive: boolean; promoCodeEntered: boolean; percentOff?: number }
): number {
  if (options.promoCodeEntered) return 0
  if (!options.cookieActive) return 0
  const base = Math.max(0, subtotal - creditsDiscountDollars)
  const p = (options.percentOff ?? EARLY_ACCESS_DISCOUNT_PERCENT) / 100
  return Math.round(base * p * 100) / 100
}

export function dispatchEarlyAccessCartRefresh(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(EARLY_ACCESS_CART_REFRESH_EVENT))
}
