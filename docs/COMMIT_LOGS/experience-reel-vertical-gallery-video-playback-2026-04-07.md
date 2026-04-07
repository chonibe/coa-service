# Experience reel: vertical gallery Shopify video playback

**Date:** 2026-04-07

## Problem

Native Shopify video in the vertical gallery used `ArtistCollectionVideoEmbed` with a **single** playback URL, losing full `sources` handling (HLS vs progressive) and matching detail embed behavior.

## Changes

- [x] [`lib/shop/product-carousel-slides.ts`](../../lib/shop/product-carousel-slides.ts) — `shopifyVideoPlaybackUrl` prefers **MP4/WebM** over **MOV** when Shopify lists both (Chrome often cannot play QuickTime in `<video>`).
- [x] [`app/(store)/shop/experience-v2/components/ProductStandaloneVideoEmbed.tsx`](../../app/(store)/shop/experience-v2/components/ProductStandaloneVideoEmbed.tsx) — new `ShopifyInlineVideo`; `ProductStandaloneVideoEmbed` and `ArtistCollectionVideoEmbed` native branch reuse it; `HomeStyleProgressiveVideo` uses `preload="metadata"` when loaded immediately (`deferLoadMs <= 0`).
- [x] [`app/(store)/shop/experience/components/SplineFullScreen.tsx`](../../app/(store)/shop/experience/components/SplineFullScreen.tsx) — vertical gallery `kind: 'video'` renders `ShopifyInlineVideo` with full `sources` + poster; fixed `aspect-video` container.

## Verify

Reel gallery video: tap play; HLS (m3u8) and MP4 should work; external YouTube/Vimeo unchanged (iframe).

## Follow-up (same feature)

- Reel native video: **`variant="reelMutedAutoplay"`** — `muted` + `autoPlay` + `loop`, `IntersectionObserver` play/pause when ~20% visible; HLS uses `MANIFEST_PARSED` to start playback.
- Aspect box: **`shopifyPlaybackVideoSource`** width/height → CSS `aspect-ratio` + `maxHeight: min(85dvh, 920px)`; fallback `aspect-video` if Storefront omits dimensions.
- **`shopifyPlaybackVideoSource`**: URL match fallback to widest source when `pickVideoSourceUrl` string ≠ any `sources[].url`.
