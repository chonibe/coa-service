# PostHog Funnel & Onboarding Improvements — 2026-03-15

**Commit:** `68f778d41`  
**Branch:** `main`  
**Deployed:** https://app.thestreetcollector.com  
**Plan reference:** `posthog_funnel_improvements_6196a99e.plan.md`

---

## Summary

Comprehensive implementation of the PostHog funnel and onboarding improvement plan. Fixes critical data quality bugs, adds granular event tracking across all key user journeys, and provides tooling to create 50+ PostHog insights via the API.

---

## Implementation Checklist

### Phase 1 — Critical Data Quality Fixes

- [x] **[lib/posthog.ts](../../lib/posthog.ts)** — Added 30+ new `FunnelEvents` constants; added `captureSessionContext()`, `tagSessionForReplay()`, `setUserProperty()`, `captureViewCart()`, `captureAddShippingInfo()` helpers
- [x] **[IntroQuiz.tsx](../../app/(store)/shop/experience/components/IntroQuiz.tsx)** — Fixed skip contamination: "Skip for now" now fires `experience_quiz_skipped` instead of `experience_quiz_completed`. Added step-level tracking: `experience_quiz_step_completed` on steps 1 & 2 with answer + time_spent. Added `onboarding_step_viewed` / `onboarding_step_abandoned` on step transitions. Added `experience_onboarding_login_clicked` on "Already have an account?" click. Added `onFocus` handler on name input.
- [x] **[ExperienceClient.tsx](../../app/(store)/shop/experience/components/ExperienceClient.tsx)** — A/B variant mirrored to PostHog via `experience_ab_variant_known` event and `setUserProperty('experience_ab_variant', variant)`. Added `experience_redirected_to_onboarding` before router.replace redirect.
- [x] **[onboarding-wizard.tsx](../../app/collector/components/onboarding-wizard.tsx)** — Fixed step 0 tracking bug: removed `currentStep > 0 && currentStep < steps.length` guard so all steps (including Welcome step 0 and final step) fire `collector_onboarding_step_completed`. Added `onboarding_step_viewed` on each step. Added `onFocus` handlers for first_name, last_name, phone, bio fields.
- [x] **[cart/page.tsx](../../app/(store)/shop/cart/page.tsx)** — Fixed `begin_checkout` timing: now fires AFTER successful API response, not before. Added `view_cart` on mount. Added `checkout_cancelled` when `?cancelled=true` param present. Added `checkout_error` in catch block with `tagSessionForReplay('checkout-error')`.
- [x] **[CheckoutLayout.tsx](../../components/shop/checkout/CheckoutLayout.tsx)** — Added `add_shipping_info` on address save. Added `add_payment_info` + `checkout_step_viewed` on payment method selection. Added `promo_code_applied` on valid promo.
- [x] **[OrderBar.tsx](../../app/(store)/shop/experience/components/OrderBar.tsx)** — Added `add_shipping_info` + `checkout_step_viewed` on address save. Added `checkout_error` + `tagSessionForReplay` on fetch error. Added `payment_error` + `tagSessionForReplay` in `onError` callback.
- [x] **[checkout-success-content.tsx](../../app/(store)/shop/checkout/success/checkout-success-content.tsx)** — Added `payment_error` + `tagSessionForReplay('payment-error')` in catch block.
- [x] **[welcome-client.tsx](../../app/collector/welcome/welcome-client.tsx)** — Extracted claim flow into `ClaimFlow` component. Added `collector_claim_page_viewed` on mount, `collector_claim_google_clicked` on Google sign-in, `collector_claim_continue_shopping` on "Continue Shopping".

### Phase 2 — Session Context & User Properties

- [x] **[providers.tsx](../../app/providers.tsx)** — Added `loaded` callback to PostHog init that calls `captureSessionContext()`. This fires `session_context` event and sets `preferred_device` person property on every new session.
- [x] **[track/[token]/page.tsx](../../app/track/[token]/page.tsx)** — Added `setUserProperty('total_purchases', n)` and `setUserProperty('first_purchase_at', date)` when orders are loaded.

### Phase 3 — Feature Flag Hook

- [x] **[hooks/use-posthog-feature-flag.ts](../../hooks/use-posthog-feature-flag.ts)** — New hook: `usePostHogFeatureFlag(key)` → returns `boolean | string | null`. Also exports `usePostHogFeatureFlagEnabled(key)` → `boolean | null`. Tracks `$feature_flag_called` exposure event on first resolution.

### Phase 4 — PostHog Insights Setup Script

- [x] **[scripts/setup-posthog-insights.js](../../scripts/setup-posthog-insights.js)** — Creates via PostHog REST API:
  - 10 funnels (purchase, quiz, collector onboarding, checkout, experience→purchase, claim, redirect, error recovery, gift vs self, A/B test)
  - 12 trends (completion rates, error rates, volume, cancellations, filter usage, device split, returning users)
  - 8 paths (landing→purchase, after quiz, after error, after skip, post-onboarding, post-purchase, claim, cart drop-off)
  - 20 cohorts (completers, skippers, abandoners, purchasers, error users, A/B variants, mobile/desktop, gift, returning, promo, redirect, high-engagement, lamp owners, claim, repeat/first-time purchasers)
  - 4 dashboards (Funnel & Onboarding, Conversion Optimization, User Journey Paths, Audience Cohorts)

### Phase 5 — Documentation

- [x] **[EVENTS_MAP.md](../../docs/features/analytics/EVENTS_MAP.md)** — Full rewrite of funnel events table; added micro-interaction events, e-commerce events, error/session events, claim flow events, feature flags, and user properties tables
- [x] **[README.md](../../docs/features/analytics/README.md)** — Updated PostHog section with session context, micro-events, session replay tagging, feature flags, user properties, insight setup script instructions, heatmap configuration, and real-time alert guidance

---

## New Events Reference

| Event | Source | Key Properties |
|-------|--------|----------------|
| `experience_quiz_skipped` | IntroQuiz.tsx | `at_step` |
| `experience_quiz_step_completed` | IntroQuiz.tsx | `step`, `answer`, `time_spent_seconds` |
| `experience_onboarding_login_clicked` | IntroQuiz.tsx | `step` |
| `experience_redirected_to_onboarding` | ExperienceClient.tsx | `reason`, `ab_variant` |
| `experience_ab_variant_known` | ExperienceClient.tsx | `variant`, `is_new_assignment` |
| `onboarding_step_viewed` | IntroQuiz + onboarding-wizard | `step`, `context` |
| `onboarding_step_abandoned` | IntroQuiz + onboarding-wizard | `step`, `context`, `time_spent_seconds` |
| `onboarding_step_interaction` | IntroQuiz.tsx | `step`, `button_type`, `context` |
| `onboarding_field_focused` | IntroQuiz + onboarding-wizard | `field_name`, `step`, `context` |
| `checkout_step_viewed` | CheckoutLayout + OrderBar | `step_name`, `payment_method` |
| `checkout_cancelled` | cart/page.tsx | `item_count`, `subtotal` |
| `promo_code_applied` | CheckoutLayout.tsx | `code`, `discount_amount` |
| `view_cart` | cart/page.tsx | `items`, `value`, `currency` |
| `add_shipping_info` | CheckoutLayout + OrderBar | `items`, `value`, `country`, `currency` |
| `add_payment_info` | CheckoutLayout.tsx | `payment_type`, `items`, `value`, `currency` |
| `checkout_error` | cart/page.tsx + OrderBar | `error_message`, `source` |
| `payment_error` | OrderBar + checkout-success | `error_message`, `source` |
| `session_context` | providers.tsx (on init) | `referrer`, `device_type`, `is_returning_user`, etc. |
| `session_tagged` | tagSessionForReplay() | `tag` |
| `collector_claim_page_viewed` | welcome-client.tsx | `profile_exists` |
| `collector_claim_google_clicked` | welcome-client.tsx | |
| `collector_claim_continue_shopping` | welcome-client.tsx | |

---

## Running the Insights Setup Script

```bash
POSTHOG_API_KEY=phx_your_personal_api_key \
POSTHOG_PROJECT_ID=your_project_id \
node scripts/setup-posthog-insights.js
```

Get your Personal API key from PostHog Settings → User API Keys.  
Get your Project ID from PostHog Settings → Project.
