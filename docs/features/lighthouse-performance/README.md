# Lighthouse Performance and Best Practices

## Overview

Optimizations applied to improve Lighthouse scores for https://app.thestreetcollector.com/ (street-collector landing page). Targets Performance (~66 → higher) and Best Practices (~79 → higher).

## Implementation Summary

| Area | Changes |
|------|---------|
| **Video payload** | `LazyVideo` component with Intersection Observer; below-fold videos load only when near viewport; `preload="none"` |
| **Proxy-video cache** | `Cache-Control: public, max-age=31536000, immutable` on proxy-video API |
| **Preload & font** | Hero poster preload in `<head>` with `fetchPriority="high"`; preconnect for fonts; Material Symbols via preload-as-style pattern |
| **Third-party scripts** | PostHog deferred to 3.5s; Google Analytics/Ads deferred to 2.5s via `requestIdleCallback` |
| **Bfcache** | Replaced `force-dynamic` with `revalidate = 60` on street-collector and home page |
| **Images** | Explicit `width`/`height` on hero poster; Next image optimization left disabled |

## Key Files

- [components/LazyVideo.tsx](/components/LazyVideo.tsx) – Lazy-loading video wrapper
- [app/layout.tsx](/app/layout.tsx) – Preload, preconnect, deferred GA
- [app/api/proxy-video/route.ts](/app/api/proxy-video/route.ts) – Cache headers
- [components/google-analytics.tsx](/components/google-analytics.tsx) – Deferred GA/Ads load

## Best Practices: Third-Party Cookies (2026-03-10)

- **Google Consent Mode v2**: `gtag('consent', 'default', { ad_storage, ad_user_data, ad_personalization, analytics_storage: 'denied' })` set before gtag.js loads — prevents Google Ads / doubleclick.net third-party cookies until user consent
- **Stripe prefetch**: `prefetch={false}` on CTA `Link` components in [FixedCTAButton](app/shop/street-collector/FixedCTAButton.tsx) — prevents Next.js from prefetching `/experience` (which loads Stripe), so `m.stripe.com` cookie is not set on landing

## Not Implemented (Cancelled)

- **Code-split street-collector sections**: `next/dynamic` for MeetTheStreetLamp, ArtistCarousel, etc. caused build error (`Cannot access 'y' before initialization`)
- **GSAP/reflow batching**: Deferred due to risk and complexity
- **Next image optimization**: Left disabled (`unoptimized: true`); explicit dimensions added instead
- **Stripe-on-checkout-only**: Stripe likely not on landing page; unchanged

## Experience & Checkout Optimization — Round 1 (2026-03-16)

See [EXPERIENCE_CHECKOUT_OPTIMIZATION.md](EXPERIENCE_CHECKOUT_OPTIMIZATION.md) for the full audit and changes applied to the `/experience` page (Performance 27 → 68, TBT 4,710ms → 100ms).

**Key changes:**
- `PaymentStep` lazy-loaded via `next/dynamic` in `OrderBar.tsx` — removes Stripe/hCaptcha/Google Pay from initial experience bundle
- PostHog deferred 10s on `/experience` paths
- Facebook Pixel deferred via `requestIdleCallback`
- `internal.png` → `internal.webp` (2.8 MB → 87 KB, 97% reduction)
- Conditional modal rendering in `CheckoutLayout.tsx` (defers Google Maps SDK)
- `framer-motion` removed from `OrderBar.tsx` and `CheckoutLayout.tsx`

## Experience 90+ Score — Round 3 (2026-03-16)

After Round 2, Performance was 69 (LCP 10.4s) and Best Practices 82. Root issues: Spline canvas was LCP element; `_fbp` cookie written early; COOP blocking Stripe popups; onboarding uncached.

**Key changes:**
- `Configurator.tsx`: static `internal.webp` facade as LCP candidate; Spline mounts via `requestIdleCallback` after LCP
- `meta-pixel.tsx`: `getFbp()`/`getFbc()` moved inside `loadScript` — no early `_fbp` cookie
- `next.config.js`: COOP changed to `same-origin-allow-popups` — fixes Stripe popup console errors
- `onboarding/page.tsx`: `unstable_cache` for lamp product (5-min TTL)
- `IntroQuiz.tsx`: `fadeUp` animation opacity-only (no `y` offset) — reduces CLS

## Experience LCP/TTI Optimization — Round 2 (2026-03-16)

After Round 1, LCP remained at 10.3s and TTI at 10.3s. Root causes: `force-dynamic` overriding fetch cache, Spline preload firing too late, A/B variant 2-render-cycle waterfall, and remaining `framer-motion` in the critical bundle.

**Key changes:**
- `unstable_cache` wrappers on Shopify product fetches in `page.tsx` — bypasses `force-dynamic` fetch-cache override; product catalog cached 5 min
- `<link rel="preload">` for Spline scene added directly in `layout.tsx` JSX — browser starts 6.7MB download on HTML parse, 2-3s earlier
- A/B cookie read moved to `useState` lazy initializer in `ExperienceClient.tsx` — eliminates 2-render-cycle spinner waterfall for returning visitors
- `DiscountCelebration` converted to `next/dynamic({ ssr: false })` in `ExperienceSlideoutMenu.tsx` — removes framer-motion from initial bundle
- `motion.div` lamp counter pulse replaced with CSS `animate-lamp-pulse` keyframe; `AnimatePresence` removed

## Roadmap to 100%

See [LIGHTHOUSE_100_PLAN.md](LIGHTHOUSE_100_PLAN.md) for a phased plan to reach 100% on Performance and Best Practices.

## Validation

Run Lighthouse (mobile, throttled) on production:

```bash
npx lighthouse https://app.thestreetcollector.com/ --preset=perf --throttling-method=simulate --output=html
```

## Version

- **Last Updated**: 2026-03-16
- **Ref**: [docs/COMMIT_LOGS.md](/docs/COMMIT_LOGS.md#commit-lighthouse-performance-and-best-practices-2026-03-10)
