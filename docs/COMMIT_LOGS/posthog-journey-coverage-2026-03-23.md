# Commit log: PostHog experience & journey coverage (2026-03-23)

Checklist of changes for this workstream (reference without opening git history).

- [x] **[scripts/setup-posthog-insights.js](../../scripts/setup-posthog-insights.js)** — Migrated cohorts from behavioral REST filters to **person** filters (collector onboarding, checkout error, promo, redirect, high engagement, claim, skippers). Removed **Abandoned Checkout** from sync; documented as UI HogQL. Updated Purchasers description for Stripe server capture.
- [x] **[scripts/posthog-audit.js](../../scripts/posthog-audit.js)** — Expanded person key sampling; full `last_error_message`; `--verbose` / `POSTHOG_AUDIT_VERBOSE`.
- [x] **[lib/posthog-server.ts](../../lib/posthog-server.ts)** — `PostHogServerEventProperties` allows nested `$set` / `$set_once` for batch capture.
- [x] **[app/api/stripe/webhook/route.ts](../../app/api/stripe/webhook/route.ts)** — Server `purchase` to PostHog with email `distinct_id` and `$set.has_purchased`.
- [x] **[app/(store)/shop/experience-v2/components/ExperienceOnboardingClient.tsx](../../app/(store)/shop/experience-v2/components/ExperienceOnboardingClient.tsx)** — Sets `experience_redirected_to_onboarding_flag` when referrer is v2 configurator (not onboarding).
- [x] **[docs/features/analytics/EVENTS_MAP.md](../features/analytics/EVENTS_MAP.md)** — Experience v2 shell vs onboarding; funnel paths; new events and person properties; server purchase.
- [x] **[docs/features/analytics/README.md](../features/analytics/README.md)** — Cohort ownership table; 20 synced cohorts; audit verbose; Stripe PostHog purchase; insight templates link; Meta Lead path fix.
- [x] **[docs/features/analytics/INSIGHT_TEMPLATES.md](../features/analytics/INSIGHT_TEMPLATES.md)** — New: HogQL abandoned checkout pattern, v2 funnel, breakdowns, replay filters.

**Follow-up (operators):** Run `POSTHOG_UPDATE_EXISTING_COHORTS=true` once when syncing cohort definition changes to EU/US PostHog. Recreate or migrate any existing **Abandoned Checkout** cohort manually in the UI if the old behavioral definition errored.
