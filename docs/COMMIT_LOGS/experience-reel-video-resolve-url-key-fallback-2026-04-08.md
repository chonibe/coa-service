# Commit log: Reel video — resolve URL once, remount key, progressive → HLS fallback

**Date:** 2026-04-08

## Summary

Native Shopify reel video only has **CDN URLs in `sources[]`** — there is no separate iframe/embed link in Storefront. The practical “pull the link separately” pattern is: **resolve playback once** in the reel row, pass it as **`playbackUrl`**, and **`key={item.id}`** so React does not reuse a stale `<video>` element. **Progressive** playback now tries **`shopifyProgressivePlaybackCandidateUrls`** (tallest-first, same pool as PDP) and, if every file errors, **falls back to HLS** when Shopify also exposes an m3u8.

## Checklist

- [x] [`app/(store)/shop/experience/components/SplineFullScreen.tsx`](../../app/(store)/shop/experience/components/SplineFullScreen.tsx) — `key={item.id}`, `playbackUrl={playback}`.
- [x] [`app/(store)/shop/experience-v2/components/ProductStandaloneVideoEmbed.tsx`](../../app/(store)/shop/experience-v2/components/ProductStandaloneVideoEmbed.tsx) — optional `playbackUrl`, progressive candidate rotation, HLS fallback after exhausted progressive URLs; progressive `<video>` uses **`src` only** (no redundant `<source>`).
- [x] [`lib/shop/product-carousel-slides.ts`](../../lib/shop/product-carousel-slides.ts) — **`shopifyProgressivePlaybackCandidateUrls`**.
- [x] [`lib/shop/product-carousel-slides.test.ts`](../../lib/shop/product-carousel-slides.test.ts) — candidate URL ordering test.

## Verification

- Reel native video: scroll to clip — plays or steps through renditions / HLS without a stuck prior item’s buffer.
- Product with MP4 + m3u8: if top MP4 fails in Chrome, HLS path should load.
