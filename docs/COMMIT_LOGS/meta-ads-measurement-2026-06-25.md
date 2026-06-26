# Meta Ads Measurement + Attribution Deploy — 2026-06-25

## Summary

Shipped Meta ads measurement documentation, PostHog paid-traffic funnel specs, UTM/checkout attribution code, Experience V3 Spline collection thumbnails, and Vercel env fixes for Pipeboard + Website Events pixel.

## Checklist

- [x] [docs/features/meta-ads/README.md](../features/meta-ads/README.md) — v1.1.0 measurement checklist (sections A–F)
- [x] [docs/features/meta-ads/POSTHOG_META_FUNNEL.md](../features/meta-ads/POSTHOG_META_FUNNEL.md) — funnel/trend/cohort/replay specs
- [x] [docs/features/analytics/INSIGHT_TEMPLATES.md](../features/analytics/INSIGHT_TEMPLATES.md) — Meta paid traffic cross-link
- [x] [docs/features/analytics/EVENTS_MAP.md](../features/analytics/EVENTS_MAP.md) — Attribution person/event properties
- [x] [skills/meta-ads-run/SKILL.md](../../skills/meta-ads-run/SKILL.md) — Measurement (post-launch) section
- [x] [lib/posthog.ts](../../lib/posthog.ts) — `captureInitialUtmPersonProperties`, `identifyCheckoutPurchaser`
- [x] [app/(store)/shop/components/AffiliatePersistence.tsx](../../app/(store)/shop/components/AffiliatePersistence.tsx) — UTM + fbclid persistence
- [x] [components/shop/checkout/CheckoutLayout.tsx](../../components/shop/checkout/CheckoutLayout.tsx), [PaymentStep.tsx](../../components/shop/checkout/PaymentStep.tsx) — guest identify
- [x] [app/(store)/shop/experience-v3/components/ExperienceV3Client.tsx](../../app/(store)/shop/experience-v3/components/ExperienceV3Client.tsx) — Spline collection thumbnails
- [x] Vercel production: `PIPEBOARD_API_TOKEN` set (non-empty), `NEXT_PUBLIC_META_PIXEL_ID` → `1315234756106483`

## Vercel env notes

- **Rotate** Pipeboard API key at pipeboard.co (prior key was exposed in chat).
- Preview `PIPEBOARD_API_TOKEN` may still need branch-scoped add via Vercel dashboard.

## Post-deploy verification

- [ ] `/experience?utm_source=facebook&utm_medium=paid&utm_campaign=test` → PostHog person `initial_utm_*`
- [ ] Events Manager → Website Events pixel receives PageView
- [ ] Guest checkout → `identify(email)` before `purchase`
