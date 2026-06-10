---
title: "Analytics & Tracking Documentation (GA4, PostHog, Meta CAPI)"
type: source
tags: [analytics, ga4, posthog, meta, tracking, ads]
created: 2026-04-14
updated: 2026-04-14
sources: []
---

# Analytics & Tracking Documentation (GA4, PostHog, Meta CAPI)

Comprehensive documentation for the three-layer analytics stack: GA4, PostHog session replay/product analytics, and Meta Conversions API with server-side signals.

## Metadata

- **Author**: The Street Collector team
- **File**: `docs/features/analytics/README.md`
- **Date**: Living document, last observed 2026-04-14

## Summary

The platform runs GA4, PostHog, and Meta CAPI in parallel. GA4 handles e-commerce event tracking via `gtag.js`. PostHog provides session replay, heatmaps, autocapture, funnel analysis, A/B testing, and feature flags. Meta CAPI provides server-side ad conversion signals that complement the browser pixel, with deduplication via shared `event_id`.

All Meta CAPI events are mirrored to PostHog (with `source: 'meta_capi'`), enabling unified funnels across ad attribution and product analytics. The Stripe webhook sends `Purchase` and `Refund` to Meta CAPI directly, bypassing browser tracking gaps.

## Key Takeaways

- **GA4**: `lib/google-analytics.ts`; events also mirrored to PostHog.
- **PostHog**: `app/providers.tsx`; session replay, heatmaps, autocapture, person profiles, funnels, feature flags.
- **Meta CAPI**: `/api/meta/conversions`; 8 events; browser pixel + CAPI share `event_id` for dedup.
- **Server purchase**: Stripe webhook → Meta CAPI `Purchase` + PostHog `purchase` (not browser-dependent).
- **Lead**: newsletter signup, quiz signup, onboarding wizard → Meta CAPI with hashed email.
- **Custom Audiences**: `lib/meta-custom-audiences-server.ts`; requires `META_CUSTOM_AUDIENCE_ID` env.
- **Meta Business**: ID `114285802744042`; dataset ID `1315234756106483`.
- **Session entry path**: `sessionStorage` + PostHog person property `last_session_entry_path` for behavioral cohorts.
- **Feature flags**: `hooks/use-posthog-feature-flag.ts`; A/B variant → `experience_ab_variant` person property.
- **Session replay tagging**: `tagSessionForReplay('checkout-error' | 'payment-error')`.
- **Meta Parameter Builder**: `lib/meta-parameter-builder.ts` auto-generates `fbc`/`fbp` for better EMQ.
- **AEM priority**: Purchase > InitiateCheckout > AddToCart > ViewContent > AddPaymentInfo > PageView > Search > Lead.
- **Diagnostics**: `/api/meta/diagnostics` (admin) — env readiness + EMQ field completeness.
- **PostHog MCP**: optional; cohorts work via REST API without it.
- **Full event map**: `docs/features/analytics/EVENTS_MAP.md`.
- **Insight templates**: `docs/features/analytics/INSIGHT_TEMPLATES.md` (HogQL abandoned checkout, experience v2 funnel).

## New Information

- `captureSessionContext()` captures `referrer`, `device_type`, `is_returning_user`, `screen_width/height`, `language` on PostHog init.
- `ensureSessionEntryForAnalytics()` runs on every `$pageview` to set entry path even if PostHog `loaded` runs late.
- `begin_checkout` fires only AFTER the checkout session is successfully created (not on button click).
- Each item in e-commerce events includes `item_list_name` (stage: `home` | `products` | `artist` | `pdp` | `experience`).
- Server-side PostHog `purchase` uses purchaser email as `distinct_id` — merges with client person on subsequent login.

## Contradictions

None against other wiki pages.

## Entities Mentioned

- [[the-street-collector]]
- [[vercel]]
- [[shopify]]

## Concepts Touched

- [[analytics-tracking]]
- [[experience-page]]
- [[credits-economy]]
