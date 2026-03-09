/**
 * PostHog helpers: funnel events, e-commerce, and user identification.
 * Use for journey analysis, funnel drop-off, and behavior.
 *
 * Events are also sent to GA4 via lib/google-analytics.ts where applicable.
 * PostHog gets: session replay, heatmaps, autocapture + these custom events.
 */

import posthog from "posthog-js"

function getPostHog(): typeof posthog | null {
  if (typeof window === "undefined") return null
  return posthog
}

/** Capture a funnel or behavior event for journey analysis. */
export function captureFunnelEvent(
  eventName: string,
  properties?: Record<string, string | number | boolean | undefined>
) {
  const ph = getPostHog()
  if (!ph) return
  ph.capture(eventName, properties)
}

/** Identify user (call from client after login). Prefer PostHogIdentify in providers for shop users. */
export function identifyUser(
  distinctId: string,
  traits?: Record<string, string | number | boolean | undefined>
) {
  const ph = getPostHog()
  if (!ph) return
  ph.identify(distinctId, traits)
}

/** E-commerce: mirror GA4-style events to PostHog for funnel analysis. */
export interface PostHogProductItem {
  item_id?: string
  item_name?: string
  item_brand?: string
  price?: number
  quantity?: number
  currency?: string
}

export function captureViewItem(item: PostHogProductItem) {
  getPostHog()?.capture("view_item", { ...item, currency: item.currency ?? "USD" })
}

export function captureAddToCart(item: PostHogProductItem) {
  getPostHog()?.capture("add_to_cart", { ...item, currency: item.currency ?? "USD" })
}

export function captureRemoveFromCart(item: PostHogProductItem) {
  getPostHog()?.capture("remove_from_cart", { ...item, currency: item.currency ?? "USD" })
}

export function captureBeginCheckout(items: PostHogProductItem[], value?: number, currency = "USD") {
  getPostHog()?.capture("begin_checkout", { items, value, currency })
}

export function captureAddPaymentInfo(
  paymentType: string,
  items: PostHogProductItem[],
  value?: number,
  currency = "USD"
) {
  getPostHog()?.capture("add_payment_info", {
    payment_type: paymentType,
    items,
    value,
    currency,
  })
}

export function capturePurchase(props: {
  transaction_id: string
  value: number
  currency: string
  items: PostHogProductItem[]
  shipping?: number
  items_count?: number
}) {
  getPostHog()?.capture("purchase", props)
}

export function captureSearch(searchTerm: string) {
  getPostHog()?.capture("search", { search_term: searchTerm })
}

/** Funnel: onboarding & experience (use for drop-off analysis). */
export const FunnelEvents = {
  /** Vendor onboarding wizard */
  vendor_onboarding_started: "vendor_onboarding_started",
  vendor_onboarding_step_completed: "vendor_onboarding_step_completed",
  vendor_onboarding_completed: "vendor_onboarding_completed",
  vendor_onboarding_skipped: "vendor_onboarding_skipped",
  /** Collector onboarding */
  collector_onboarding_started: "collector_onboarding_started",
  collector_onboarding_step_completed: "collector_onboarding_step_completed",
  collector_onboarding_completed: "collector_onboarding_completed",
  collector_onboarding_skipped: "collector_onboarding_skipped",
  /** Experience (lamp configurator) */
  experience_quiz_started: "experience_quiz_started",
  experience_quiz_completed: "experience_quiz_completed",
  experience_started: "experience_started",
  experience_filter_applied: "experience_filter_applied",
  /** Blockages / errors (optional: capture when user hits an error or dead end) */
  checkout_error: "checkout_error",
  payment_error: "payment_error",
} as const
