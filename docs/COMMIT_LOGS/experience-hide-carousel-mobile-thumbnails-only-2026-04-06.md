# Commit log: Hide artwork carousel on mobile; thumbnails only on sticky bar (2026-04-06)

## Checklist

- [x] [`ExperienceV2Client.tsx` (v2)](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) — Carousel wrapper **`hidden md:block`**; **`suppressCartThumbnails={!isMobile && splineInView}`**; **`onSelectThumbnailForSpline`** when **`isMobile`** (not gated on `splineInView`).
- [x] [`ExperienceV2Client.tsx` (legacy)](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) — Same as v2.
- [x] [`ExperienceCheckoutStickyBar.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx) — Doc comment: mobile has no carousel duplicate; suppress is desktop-only concern.
- [x] [`docs/features/experience-v2/README.md`](../features/experience-v2/README.md) — Integrates + changelog.
- [x] [`docs/features/experience/README.md`](../features/experience/README.md) — Overview.

## QA

- **Under 768px width**: no horizontal artwork carousel over the reel; sticky bar shows thumbs + add FAB + checkout when applicable; thumb taps still drive Spline selection.
- **`md`+**: unchanged (carousel visible; suppress thumbs while `splineInView`).

## Known limitation

- Legacy **watchlist** with **zero** items: sticky bar is hidden; empty-state copy was in the carousel — on mobile use **header** (or similar) to switch back to collection.
