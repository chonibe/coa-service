# Commit log: Experience reel — free scroll over video; remove first-visit scroll hint

**Date:** 2026-04-08

## Summary

- **Removed** the first-visit / session **programmatic reel nudge** (scroll down past Spline then back) and its **`ignoreSlideSyncUntilRef` ~5.2s guard** — scrolling is never interrupted for that animation.
- **Wheel over native / embed video:** [`SplineFullScreen`](../../app/(store)/shop/experience/components/SplineFullScreen.tsx) adds **capture-phase** `wheel` on the reel scroll container when the target is under **`[data-reel-wheel-forward]`** (wrappers around `ShopifyInlineVideo` and `ArtistCollectionVideoEmbed` gallery rows), applies **`scrollTop`** manually, and **`preventDefault`** so the browser does not trap the gesture (e.g. volume on `<video>`).

## Checklist

- [x] [`app/(store)/shop/experience/components/SplineFullScreen.tsx`](../../app/(store)/shop/experience/components/SplineFullScreen.tsx)

## Verification

- Scroll the vertical reel while the cursor is over the product video: reel should move; no one-time auto scroll on first open.
