# Commit log: Vertical reel native video uses `ShopifyInlineVideo` (slideout parity)

**Date:** 2026-04-08

## Summary

[`SplineFullScreen`](../../app/(store)/shop/experience/components/SplineFullScreen.tsx) no longer uses a separate **`ExperienceReelGalleryVideo`** stack. Native product video in the vertical reel now renders **`ShopifyInlineVideo`** — the same implementation as [`ProductStandaloneVideoEmbed`](../../app/(store)/shop/experience-v2/components/ProductStandaloneVideoEmbed.tsx) / [`ArtworkDetail`](../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx) slideout cards (**`HomeStyleProgressiveVideo`** with `deferLoadMs={0}` + **`HlsOrSingleUrlVideo`** default). Removed **`ExperienceReelGalleryVideo`**, **`ReelGalleryProgressiveVideo`**, **`ReelGalleryHlsVideo`**, and related helpers from `ProductStandaloneVideoEmbed.tsx`.

## Checklist

- [x] [`app/(store)/shop/experience/components/SplineFullScreen.tsx`](../../app/(store)/shop/experience/components/SplineFullScreen.tsx) — `ShopifyInlineVideo` + `key={reelGalleryItemKey(item, idx)}`.
- [x] [`app/(store)/shop/experience-v2/components/ProductStandaloneVideoEmbed.tsx`](../../app/(store)/shop/experience-v2/components/ProductStandaloneVideoEmbed.tsx) — drop reel-only player (~420 lines).

## Verification

- Open experience reel row with native Shopify video: playback matches detail slideout (controls, progressive/HLS path).
