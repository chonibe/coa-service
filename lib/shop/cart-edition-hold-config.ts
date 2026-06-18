/** Duration a cart edition hold stays active after add-to-cart. */
export const CART_EDITION_HOLD_TTL_MS = 24 * 60 * 60 * 1000

export const CART_EDITION_HOLD_TTL_HOURS = 24

/** HttpOnly cookie identifying anonymous cart-hold sessions. */
export const CART_EDITION_HOLD_SESSION_COOKIE = 'sc_cart_edition_hold_session'

/** Client fallback when the holds table is not migrated yet (session-scoped). */
export const CART_EDITION_HOLD_SESSION_STORAGE_KEY = 'sc_cart_edition_holds'

/** @deprecated Use CART_EDITION_HOLD_SESSION_STORAGE_KEY — migrated on read. */
export const CART_EDITION_HOLD_LOCAL_STORAGE_KEY = 'sc_cart_edition_holds'
