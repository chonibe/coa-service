# Experience reel — artist bio section higher — 2026-03-20

## Summary

When [`ArtworkAccordions`](../../app/(store)/shop/experience/components/ArtworkAccordions.tsx) is shown in [`SplineFullScreen`](../../app/(store)/shop/experience/components/SplineFullScreen.tsx), section 0 (Spline) **`min-h`** drops from **`100svh` → `78svh`** so the bio/details block begins earlier in the scroll. Gallery-only reels (no accordion) keep **`100svh`**. Accordion shell: **`min-h-[50svh]`**, **`pt-3 pb-6`** (was **`py-8`**, **`60svh`**).

## Checklist

- [x] [`app/(store)/shop/experience/components/SplineFullScreen.tsx`](../../app/(store)/shop/experience/components/SplineFullScreen.tsx)
- [x] [`docs/features/experience/README.md`](../../docs/features/experience/README.md)
