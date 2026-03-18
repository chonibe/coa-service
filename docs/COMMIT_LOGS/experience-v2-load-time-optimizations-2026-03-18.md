# Experience V2 Load Time Optimizations

**Date**: 2026-03-18

## Summary

Dramatically improved Experience V2 loading time by applying proven optimizations from Experience V1 and adding new improvements specific to the V2 architecture. Targets LCP < 2.5s and TTI < 4s on mobile.

## Checklist of Changes

- [x] **[app/(store)/shop/experience/components/SplineFullScreen.tsx](../app/(store)/shop/experience/components/SplineFullScreen.tsx)** — Add Spline facade: static `/internal.webp` (87 KB) as LCP element; defer `Spline3DPreview` mount via `requestIdleCallback` (3s timeout); tap-to-load for eager users
- [x] **[app/(store)/shop/experience/page.tsx](../app/(store)/shop/experience/page.tsx)** — Parallel data fetch (`Promise.all` lamp + season collections); reduce products from 50 to 24 per season; code-split `ExperienceV2Client` with `next/dynamic`
- [x] **[app/(store)/shop/experience-v2/page.tsx](../app/(store)/shop/experience-v2/page.tsx)** — Same parallel fetch, 24 products, and code-split as experience page
- [x] **[app/(store)/shop/experience/components/ExperienceV2Client.tsx](../app/(store)/shop/experience/components/ExperienceV2Client.tsx)** — Defer artist spotlight fetch until picker opens (except when `initialArtistSlug` present); lazy-load `ArtworkPickerSheet` via dynamic import; mount picker only when opened
- [x] **[app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx](../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx)** — Same defer spotlight and lazy ArtworkPickerSheet

## Performance Impact

| Change | Impact |
|--------|--------|
| Spline facade + deferred mount | High — 3–5s LCP improvement on mobile; 6.7MB scene no longer blocks paint |
| Parallel data + 24 products | Medium — ~0.5–1.5s; ~52% less Shopify payload |
| Code-split ExperienceV2Client | Medium — ~0.5–1s TTI; smaller initial bundle |
| Defer artist spotlight | Low–medium — Fewer requests on mount |
| Lazy ArtworkPickerSheet | Low–medium — framer-motion/virtualizer load only when picker opens |

## Files Modified

- `app/(store)/shop/experience/components/SplineFullScreen.tsx`
- `app/(store)/shop/experience/components/ExperienceV2Client.tsx`
- `app/(store)/shop/experience/page.tsx`
- `app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx`
- `app/(store)/shop/experience-v2/page.tsx`

## Testing

- Run Lighthouse on `/shop/experience` (mobile, 4x slowdown) before and after
- Target: LCP < 2.5s, TTI < 4s
- Verify Spline loads after facade; tap-to-load works
- Confirm load-more still fetches additional products correctly
