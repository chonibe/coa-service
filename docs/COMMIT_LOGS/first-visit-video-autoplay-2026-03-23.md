# First-visit video autoplay — 2026-03-23

## Overview

Fixed hero and lazy-loaded videos requiring a first click to play: Shopify metaobject empty toggles no longer force `autoplay: false`, `VideoPlayer` defaults match DOM autoplay, deferred load is shorter, and `LazyVideo` / featured product retry muted `play()`.

## Checklist

- [x] [`lib/shopify/homepage-settings.ts`](../../lib/shopify/homepage-settings.ts) — `parseMetaobjectBool`; empty `autoplay` / `loop` / `muted` → `undefined` so merge uses `content/homepage.ts` fallback.
- [x] [`components/sections/VideoPlayer.tsx`](../../components/sections/VideoPlayer.tsx) — `wantsAutoplay = video.autoplay !== false`; `deferLoadMs` default 250ms; `play()` failures logged with `console.warn`.
- [x] [`components/sections/VideoPlayerEnhanced.tsx`](../../components/sections/VideoPlayerEnhanced.tsx) — same `wantsAutoplay` + programmatic `play()` on load when autoplay wanted.
- [x] [`components/LazyVideo.tsx`](../../components/LazyVideo.tsx) — `onLoadedData` + `onCanPlay` muted autoplay with `requestAnimationFrame` retry.
- [x] [`components/sections/FeaturedProduct.tsx`](../../components/sections/FeaturedProduct.tsx) — `onLoadedData` + `play()` when `enableVideoAutoplay`.
- [x] [`docs/VIDEO_CONNECTED_TO_SHOPIFY.md`](../VIDEO_CONNECTED_TO_SHOPIFY.md) — documented toggle merge behavior.

## Testing notes

- Verify `/shop/home` and `/shop/street-collector` with cold load: muted videos should start without tapping play (subject to browser data-saver / low-power policies).
- Set metaobject `autoplay` to `false` to confirm full-screen play overlay still appears when autoplay is explicitly off.
