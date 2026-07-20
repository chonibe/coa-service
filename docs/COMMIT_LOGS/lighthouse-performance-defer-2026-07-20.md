# Lighthouse performance: defer media & analytics (2026-07-20)

## Summary

Landing and experience shop routes load fewer bytes on first paint by deferring Spline and third-party analytics, shrinking experience gallery LCP sources, and lazy-mounting below-the-fold home-v2 sections.

## Checklist of Changes

- [x] **Landing hero & sections** — Responsive hero sizing, section in-view lazy mount (`app/(store)/shop/home-v2/components/LandingHero.tsx`, `lib/shop/use-section-in-view.ts`, testimonials/steps/meet-the-lamp/nav)
- [x] **Experience LCP** — 480w gallery default and related experience-v3 / carousel tweaks (`lib/shop/experience-gallery-images.ts`)
- [x] **Spline defer** — Load Spline only when sections need it (`SplineFullScreen.tsx`, experience-v3 spline section)
- [x] **Analytics defer** — GA, Meta, TikTok pixels gated until interaction or idle (`components/google-analytics.tsx`, `components/meta-pixel.tsx`, `components/tiktok-pixel.tsx`, `lib/analytics/landing-paths.ts`)
- [x] **Welcome incentive** — Strip behavior aligned with perf-friendly loading (`components/shop/WelcomeIncentiveStrip.tsx`, `lib/shop/welcome-incentive.ts`)
- [x] **Docs** — Performance plan and experience README (`docs/performance-lighthouse-100-plan.md`, `docs/features/experience/README.md`)
- [x] **Cleanup** — Remove committed Lighthouse HTML/JSON report artifacts from repo root

## Tests

- [x] `npx jest lib/shop/experience-gallery-images.test.ts lib/shop/welcome-incentive.test.ts` — 10 passed

## Deployment

- Production via `vercel --prod --yes` after push to `main`.
