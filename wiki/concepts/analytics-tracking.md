---
title: "Analytics & Tracking (GA4, PostHog, Meta CAPI)"
type: concept
tags: [analytics, ga4, posthog, meta, tracking, marketing]
created: 2026-04-14
updated: 2026-04-14
sources: [2026-04-14-analytics]
---

# Analytics & Tracking (GA4, PostHog, Meta CAPI)

The platform uses three analytics layers: GA4 for e-commerce and marketing, PostHog for session replay and product analytics, and Meta Conversions API (CAPI) for server-side ad conversion signals.

## Definition

All three systems run in parallel. GA4 events are fired via `gtag.js`. PostHog is initialised in `app/providers.tsx` with session replay, heatmaps, and autocapture. Meta CAPI receives events server-side from the Stripe webhook and `/api/meta/conversions`, deduplicating with the browser pixel using shared `event_id` values.

## Key Claims

1. **GA4**: standard e-commerce events via `lib/google-analytics.ts`; all events also mirrored to PostHog.
2. **PostHog**: session replay, heatmaps, autocapture, person profiles, funnel events, feature flags (`hooks/use-posthog-feature-flag.ts`), A/B testing.
3. **Meta CAPI**: 8 events wired (`Purchase`, `InitiateCheckout`, `AddToCart`, `ViewContent`, `AddPaymentInfo`, `PageView`, `Search`, `Lead`). Both browser pixel and CAPI send the same `event_id` for deduplication.
4. **Server-side purchase**: Stripe webhook sends `Purchase` to Meta CAPI directly — not reliant on thank-you page loading.
5. **Lead events**: newsletter signup + experience quiz signup + onboarding wizard completion all fire `Lead` to Meta CAPI with hashed email.
6. **Custom Audiences**: buyers auto-synced to Meta Custom Audiences via `lib/meta-custom-audiences-server.ts` (requires `META_CUSTOM_AUDIENCE_ID`).
7. **Meta CAPI → PostHog mirror**: all Meta CAPI events are also sent to PostHog via `lib/posthog-server.ts` with `source: 'meta_capi'`.
8. **Session context**: `captureSessionContext()` on init captures `referrer`, `device_type`, `is_returning_user`, `screen_width/height`, `language`.
9. **Session entry path**: each tab records entry pathname in `sessionStorage`; sent on pageview and funnel events for behavioral cohort building.
10. **PostHog person profiles**: `person_profiles: "always"` — anonymous visitors get person records.
11. **Feature flags**: A/B variant mirrored to PostHog person properties via `experience_ab_variant`.
12. **Session replay tagging**: `tagSessionForReplay(tag)` at drop-off points (`checkout-error`, `payment-error`).
13. **Meta Business**: `Street Collector` (`114285802744042`), dataset `Website Events` (`1315234756106483`).
14. **Diagnostics**: `/api/meta/diagnostics` (admin-only) shows Meta env readiness and EMQ metrics.

## Evidence

- [[2026-04-14-analytics]] — full implementation details, event list, PostHog configuration

## Tensions

- Three parallel systems increase complexity and potential for drift — an event added to GA4 must also be wired to PostHog and Meta CAPI.
- Server-side Meta CAPI requires `META_DATASET_API_KEY` in Vercel — missing env var silently drops conversion signals.
- AEM (Aggregated Event Measurement) priority list must be configured manually in Meta Events Manager.

## Related

- [[the-street-collector]]
- [[experience-page]]
- [[shopify]]
- [[vercel]]
