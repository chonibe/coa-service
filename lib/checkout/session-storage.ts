/**
 * Checkout session storage
 *
 * Stores cart items in sessionStorage before redirecting to /shop/checkout.
 * Used by experience OrderBar and cart page to pass items to the
 * Stripe Checkout Sessions (ui_mode: custom) flow.
 */

const KEY = 'stripe_checkout_items'

export interface CheckoutCartItem {
  productId: string
  variantId: string
  variantGid: string
  handle: string
  title: string
  price: number
  quantity: number
  image?: string
}

export function storeCheckoutItems(items: CheckoutCartItem[]): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    console.warn('[checkout] Could not store items in sessionStorage')
  }
}

export function getCheckoutItems(): CheckoutCartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CheckoutCartItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function clearCheckoutItems(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // noop
  }
}
