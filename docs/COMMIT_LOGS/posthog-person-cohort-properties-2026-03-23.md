# PostHog person-property cohorts (quiz + purchase) — 2026-03-23

**Branch:** `main`  
**Git:** `git log -1 --format=%h -- docs/COMMIT_LOGS/posthog-person-cohort-properties-2026-03-23.md` prints the commit that added this log.

---

## Summary

Behavioral cohort definitions pushed via the PostHog REST API were not calculating reliably in this project (empty cohorts / “no matching criteria” errors). Quiz completion/skip and purchaser segments are now driven by **person properties** set from the app, and cohort definitions in `scripts/setup-posthog-insights.js` were updated to match. Logged-in onboarding bypass no longer infers “quiz completed” from `completedAt` alone in `identify()` merge.

---

## Implementation Checklist

- [x] **[IntroQuiz.tsx](../../app/(store)/shop/experience-v2/components/IntroQuiz.tsx)** — `experience_quiz_completed_flag` / `experience_quiz_skipped_flag` on complete vs skip; `onComplete(answers, { skipped: true })` for skip.
- [x] **[ExperienceOnboardingClient.tsx](../../app/(store)/shop/experience-v2/components/ExperienceOnboardingClient.tsx)** — Persists `skippedQuiz: true` in `sc-experience-quiz` when user skips.
- [x] **[ExperienceClient.tsx](../../app/(store)/shop/experience-v2/components/ExperienceClient.tsx)** — Persists `quizLoginBypass: true` when saving quiz after login-from-onboarding so identify merge does not mark quiz as completed.
- [x] **[lib/posthog.ts](../../lib/posthog.ts)** — `getPostHogIdentifyTraitsFromClientStorage()` merges quiz flags from storage; `capturePurchase()` sets `has_purchased: true`.
- [x] **[app/track/[token]/page.tsx](../../app/track/[token]/page.tsx)** — Sets `has_purchased` when orders load.
- [x] **[scripts/setup-posthog-insights.js](../../scripts/setup-posthog-insights.js)** — Cohort filters: quiz completed/skipped (person); purchasers (OR `has_purchased` / `total_purchases` ≥ 1); repeat/first-time purchasers from person `total_purchases`.
- [x] **[docs/features/analytics/README.md](../../docs/features/analytics/README.md)** — Documented behavioral vs person cohorts, `npm run posthog:audit`, new person properties.
- [x] **[docs/features/analytics/EVENTS_MAP.md](../../docs/features/analytics/EVENTS_MAP.md)** — User property table updated.
- [x] **Removed** `scripts/posthog-test-behavioral-cohort.js`, `scripts/posthog-test-quiz-cohort.js` (temporary API probes).

---

## Follow-up

- Re-run cohort sync with `POSTHOG_UPDATE_EXISTING_COHORTS=true` (once) so PostHog picks up new filter shapes: `npm run sync:posthog-cohorts`.
- Remaining behavioral-only cohorts in the script (abandoned checkout, promo, etc.) may still need HogQL/UI definitions until the API accepts those filter shapes.
