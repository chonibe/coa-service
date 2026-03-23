/**
 * PostHog helpers: funnel events, e-commerce, and user identification.
 * Use for journey analysis, funnel drop-off, and behavior.
 *
 * Events are also sent to GA4 via lib/google-analytics.ts where applicable.
 * PostHog gets: session replay, heatmaps, autocapture + these custom events.
 */

import posthog from "posthog-js"

/** localStorage key for persisted experience quiz (must match ExperienceClient). */
const EXPERIENCE_QUIZ_STORAGE_KEY = "sc-experience-quiz"
const EXPERIENCE_AB_COOKIE = "sc_experience_ab"

/** sessionStorage: first path in this browser tab (PostHog “session” activity context for cohorts). */
const SESS_ENTRY_PATH_KEY = "sc_ph_sess_entry_path"
const SESS_ENTRY_AT_KEY = "sc_ph_sess_entry_at"

/**
 * Record the first pathname seen in this tab if not already set.
 * Call on early pageviews so cohorts can use session_entry_path on later events.
 */
export function ensureSessionEntryForAnalytics() {
  if (typeof window === "undefined") return
  try {
    const path = window.location.pathname || "/"
    if (!sessionStorage.getItem(SESS_ENTRY_PATH_KEY)) {
      sessionStorage.setItem(SESS_ENTRY_PATH_KEY, path)
      sessionStorage.setItem(SESS_ENTRY_AT_KEY, new Date().toISOString())
    }
  } catch {
    /* private mode / blocked storage */
  }
}

/**
 * Properties attached to custom + commerce events so PostHog cohorts can segment
 * by “where this tab started” vs “where this event fired” (behavioral + event filters).
 */
export function getSessionActivityProperties(): Record<string, string> {
  if (typeof window === "undefined") return {}
  const deviceType = getDeviceType()
  let entryPath = ""
  let entryAt = ""
  try {
    entryPath = sessionStorage.getItem(SESS_ENTRY_PATH_KEY) || ""
    entryAt = sessionStorage.getItem(SESS_ENTRY_AT_KEY) || ""
  } catch {
    /* ignore */
  }
  const activityPath = window.location.pathname || "/"
  return {
    device_type: deviceType,
    session_entry_path: entryPath || activityPath,
    activity_path: activityPath,
    ...(entryAt ? { session_entry_at: entryAt } : {}),
  }
}

function captureWithSessionActivity(
  eventName: string,
  properties?: Record<string, string | number | boolean | undefined>
) {
  const ph = getPostHog()
  if (!ph) return
  const sessionProps = getSessionActivityProperties()
  ph.capture(eventName, { ...sessionProps, ...properties })
}

/**
 * Read segmentation traits from cookie + localStorage for `identify()` merges.
 * Keeps PostHog person properties aligned with quiz + A/B when users sign in.
 */
export function getPostHogIdentifyTraitsFromClientStorage(): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {}
  if (typeof window === "undefined") return out
  try {
    const raw = localStorage.getItem(EXPERIENCE_QUIZ_STORAGE_KEY)
    if (raw) {
      const j = JSON.parse(raw) as { ownsLamp?: boolean; purpose?: string }
      if (typeof j.ownsLamp === "boolean") out.quiz_owns_lamp = j.ownsLamp
      if (j.purpose === "gift" || j.purpose === "self") out.quiz_purpose = j.purpose
    }
  } catch {
    /* ignore */
  }
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${EXPERIENCE_AB_COOKIE}=([^;]*)`))
    const v = match?.[1]?.trim()
    if (v === "onboarding" || v === "skip") out.experience_ab_variant = v
  } catch {
    /* ignore */
  }
  return out
}

function getPostHog(): typeof posthog | null {
  if (typeof window === "undefined") return null
  return posthog
}

/** Capture a funnel or behavior event for journey analysis. */
export function captureFunnelEvent(
  eventName: string,
  properties?: Record<string, string | number | boolean | undefined>
) {
  captureWithSessionActivity(eventName, properties)
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
  captureWithSessionActivity("session_tagged", { tag })
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

  ensureSessionEntryForAnalytics()

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
  const sessionProps = getSessionActivityProperties()

  ph.capture("session_context", {
    referrer: document.referrer || "direct",
    device_type: deviceType,
    is_returning_user: isReturning,
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    language: navigator.language,
    ...sessionProps,
  })
  // Person properties for cohorts (requires person_profiles: "always" in init — see providers)
  ph.setPersonProperties({
    preferred_device: deviceType,
    is_returning_user: isReturning,
    /** Latest tab entry path — useful for person-based “landed on X” cohorts */
    last_session_entry_path: sessionProps.session_entry_path,
  })
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
  captureWithSessionActivity("view_item", { ...item, currency: item.currency ?? "USD" })
}

export function captureAddToCart(item: PostHogProductItem) {
  captureWithSessionActivity("add_to_cart", { ...item, currency: item.currency ?? "USD" })
}

export function captureRemoveFromCart(item: PostHogProductItem) {
  captureWithSessionActivity("remove_from_cart", { ...item, currency: item.currency ?? "USD" })
}

export function captureBeginCheckout(items: PostHogProductItem[], value?: number, currency = "USD") {
  captureWithSessionActivity("begin_checkout", { items, value, currency })
}

export function captureAddPaymentInfo(
  paymentType: string,
  items: PostHogProductItem[],
  value?: number,
  currency = "USD"
) {
  captureWithSessionActivity("add_payment_info", {
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
  captureWithSessionActivity("purchase", props)
}

export function captureSearch(searchTerm: string) {
  captureWithSessionActivity("search", { search_term: searchTerm })
}

export function captureViewCart(items: PostHogProductItem[], value?: number, currency = "USD") {
  captureWithSessionActivity("view_cart", { items, value, currency })
}

export function captureAddShippingInfo(
  items: PostHogProductItem[],
  value?: number,
  country?: string,
  currency = "USD"
) {
  captureWithSessionActivity("add_shipping_info", { items, value, country, currency })
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
