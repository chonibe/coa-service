# Commit log: Experience reel — stop scroll jitter from gallery re-sync

**Date:** 2026-04-09

## Summary

PostHog replays showed vertical scroll fighting (viewport snapping up/down) on the experience reel. Root cause: [`ArtworkInfoBar`](../../app/(store)/shop/experience/components/ArtworkInfoBar.tsx) calls `onGalleryImagesChange` whenever `galleryImages` recomputes (e.g. full product arrives from `/api/shop/products/[handle]`). Parent handlers always called `bumpReelAlign()` → [`SplineFullScreen`](../../app/(store)/shop/experience/components/SplineFullScreen.tsx) `scrollIntoView`. The v2 shell also reset `previewSlideIndex` to **0** on every update, yanking users to the top slide.

## Change checklist

- [x] [`lib/shop/experience-reel-gallery.ts`](../../lib/shop/experience-reel-gallery.ts) — `reelGalleryItemsSignature`, `isReelGalleryStrictTailExtension` (safe empty-gallery parsing).
- [x] [`app/(store)/shop/experience/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) — gallery handler + clamp effect deps.
- [x] [`app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) — same; default slide after material change matches legacy (artwork → 1, lamp → 0).
- [x] [`docs/features/experience/README.md`](../../docs/features/experience/README.md) — item 13 under Spline scroll.

## Verification

- `npm run build` succeeds.
- Manual: open `/shop/experience` or v2, scroll gallery while network completes; reel should not jump to spline/details unless thumbnails or product change materially.

## Home page (`/`)

No matching `bumpReelAlign` / `scrollIntoView` path on [`street-collector/page`](../../app/(store)/shop/street-collector/page.tsx). If jitter persists there, treat as separate investigation (layout shift, media load, fixed chrome).
