# Commit log: Experience reel video — in-view load + autoplay (ShopifyInline parity)

**Date:** 2026-04-08

## Summary

`ExperienceReelGalleryVideo` had **no IntersectionObserver** and kept **`preload="none"`** after attaching `src`, while **`ShopifyInlineVideo` `reelMutedAutoplay`** uses **`HomeStyleProgressiveVideo`**: **`canplay`** listener + **in-view** `play()` nudge (threshold ≥ 0.08) and **does not auto-pause**. Reel clips **below the fold** often never buffered or stayed at **0:00**. **Progressive** reel video now matches that pattern (`load()` when `readyState` is still empty, then muted `play()`), uses **`preload="auto"`** once the deferred URL is attached, and **HLS** reel uses the same in-view nudge + **`preload="auto"`**. **`SplineFullScreen`** keys **`ExperienceReelGalleryVideo`** with **`reelGalleryItemKey(item, idx)`** for a stable remount identity.

## Checklist

- [x] [`app/(store)/shop/experience-v2/components/ProductStandaloneVideoEmbed.tsx`](../../app/(store)/shop/experience-v2/components/ProductStandaloneVideoEmbed.tsx) — `ReelGalleryProgressiveVideo` / `ReelGalleryHlsVideo` in-view effects + progressive preload.
- [x] [`app/(store)/shop/experience/components/SplineFullScreen.tsx`](../../app/(store)/shop/experience/components/SplineFullScreen.tsx) — `key={reelGalleryItemKey(item, idx)}`.

## Verification

- Scroll the vertical reel until the product video row is **~8%+ visible**: clip should buffer and muted autoplay (or start from controls).
- Compare behavior with a PDP video for the same product.
