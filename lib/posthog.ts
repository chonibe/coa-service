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

/**
 * Set a person property on the current PostHog user.
 * Use to track user-level attributes (e.g. total_purchases, favorite_artist).
 */
export function setUserProperty(key: string, value: string | number | boolean) {
  const ph = getPostHog()
  if (!ph) return
  ph.setPersonProperties({ [key]: value })
}

/**
 * Tag the current session for targeted replay analysis.
 * Use at critical drop-off points so sessions are easy to filter in PostHog.
 */
export function tagSessionForReplay(tag: string) {
  const ph = getPostHog()
  if (!ph) return
  ph.capture("session_tagged", { tag })
}

/**
 * Get device type from user agent (same logic as captureSessionContext).
 * Use this to include device_type in events.
 */
export function getDeviceType(): string {
  if (typeof window === "undefined") return "unknown"
  const ua = navigator.userAgent
  return /Mobi|Android/i.test(ua) ? "mobile" : /Tablet|iPad/i.test(ua) ? "tablet" : "desktop"
}

/**
 * Capture session context metadata on init.
 * Attaches device, referrer, and returning-user signals to every session.
 */
export function captureSessionContext() {
  if (typeof window === "undefined") return
  const ph = getPostHog()
  if (!ph) return

  const isReturning = (() => {
    try {
      const visited = localStorage.getItem("sc_visited_before")
      if (!visited) {
        localStorage.setItem("sc_visited_before", "1")
        return false
      }
      return true
    } catch {
      return false
    }
  })()

  const deviceType = getDeviceType()

  ph.capture("session_context", {
    referrer: document.referrer || "direct",
    device_type: deviceType,
    is_returning_user: isReturning,
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    language: navigator.language,
  })
  ph.setPersonProperties({ preferred_device: deviceType })
}

/** E-commerce: mirror GA4-style events to PostHog for funnel analysis. */
export interface PostHogProductItem {
  item_id?: string
  item_name?: string
  item_brand?: string
  price?: number
  quantity?: number
  currency?: string
  /** Stage/source: home | products | artist | pdp | experience */
  item_list_name?: string
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

export function captureViewCart(items: PostHogProductItem[], value?: number, currency = "USD") {
  getPostHog()?.capture("view_cart", { items, value, currency })
}

export function captureAddShippingInfo(
  items: PostHogProductItem[],
  value?: number,
  country?: string,
  currency = "USD"
) {
  getPostHog()?.capture("add_shipping_info", { items, value, country, currency })
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
  /** Experience quiz — step-level granularity */
  experience_quiz_started: "experience_quiz_started",
  experience_quiz_step_completed: "experience_quiz_step_completed",
  experience_quiz_completed: "experience_quiz_completed",
  experience_quiz_skipped: "experience_quiz_skipped",
  experience_onboarding_login_clicked: "experience_onboarding_login_clicked",
  experience_redirected_to_onboarding: "experience_redirected_to_onboarding",
  experience_started: "experience_started",
  experience_filter_applied: "experience_filter_applied",
  /** Micro-interaction events: onboarding steps */
  onboarding_step_viewed: "onboarding_step_viewed",
  onboarding_step_interaction: "onboarding_step_interaction",
  onboarding_step_abandoned: "onboarding_step_abandoned",
  onboarding_field_focused: "onboarding_field_focused",
  onboarding_field_error: "onboarding_field_error",
  /** Micro-interaction events: checkout */
  checkout_step_viewed: "checkout_step_viewed",
  checkout_step_abandoned: "checkout_step_abandoned",
  checkout_cancelled: "checkout_cancelled",
  promo_code_applied: "promo_code_applied",
  /** Micro-interaction events: experience configurator */
  experience_artwork_previewed: "experience_artwork_previewed",
  experience_artwork_preview_time: "experience_artwork_preview_time",
  experience_filter_interaction: "experience_filter_interaction",
  /** Edition watchlist (badge + /collector/watchlist) */
  watchlist_clicked: "watchlist_clicked",
  watchlist_auth_completed: "watchlist_auth_completed",
  watchlist_saved: "watchlist_saved",
  watchlist_notification_sent: "watchlist_notification_sent",
  watchlist_converted: "watchlist_converted",
  watchlist_removed: "watchlist_removed",
  watchlist_page_viewed: "watchlist_page_viewed",
  /** Collector claim flow */
  collector_claim_page_viewed: "collector_claim_page_viewed",
  collector_claim_google_clicked: "collector_claim_google_clicked",
  collector_claim_continue_shopping: "collector_claim_continue_shopping",
  /** Blockages / errors */
  checkout_error: "checkout_error",
  payment_error: "payment_error",
} as const
