/**
 * Early access coupon — shared constants (safe for client and server).
 */

export const EARLY_ACCESS_COUPON_COOKIE = 'early_access_coupon'
export const EARLY_ACCESS_ARTIST_COOKIE = 'early_access_artist'
export const EARLY_ACCESS_COUPON_MAX_AGE_DAYS = 7

/** Default Stripe / DB percent for early-access promotion codes */
export const EARLY_ACCESS_DISCOUNT_PERCENT = 10

/** Fired after the early-access API sets the browser cookie so cart UI can re-read */
export const EARLY_ACCESS_CART_REFRESH_EVENT = 'street-collector:early-access-cart-refresh'
