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

## Not Implemented (Cancelled)

- **Code-split street-collector sections**: `next/dynamic` for MeetTheStreetLamp, ArtistCarousel, etc. caused build error (`Cannot access 'y' before initialization`)
- **GSAP/reflow batching**: Deferred due to risk and complexity
- **Next image optimization**: Left disabled (`unoptimized: true`); explicit dimensions added instead
- **Stripe-on-checkout-only**: Stripe likely not on landing page; unchanged

## Validation

Run Lighthouse (mobile, throttled) on production:

```bash
npx lighthouse https://app.thestreetcollector.com/ --preset=perf --throttling-method=simulate --output=html
```

## Version

- **Last Updated**: 2026-03-10
- **Ref**: [docs/COMMIT_LOGS.md](/docs/COMMIT_LOGS.md#commit-lighthouse-performance-and-best-practices-2026-03-10)
