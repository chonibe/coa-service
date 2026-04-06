# Commit log: Shopify product video first in experience reel gallery

**Date:** 2026-04-06

## Summary

The vertical reel under [`SplineFullScreen`](../../app/(store)/shop/experience/components/SplineFullScreen.tsx) previously only showed **photos** (`slice(1)` after the details hero). Native / external **Shopify product media video** is now inserted as the **first reel row after the hero** (before remaining images). Thumbnails and slide indices stay aligned via shared [`buildExperienceReelGalleryItems`](../../lib/shop/experience-reel-gallery.ts).

## Checklist

- [x] [`lib/shop/experience-reel-gallery.ts`](../../lib/shop/experience-reel-gallery.ts) — `ExperienceReelGalleryItem`, `getOrderedProductImages`, `buildExperienceReelGalleryItems`.
- [x] [`app/(store)/shop/experience/components/ArtworkInfoBar.tsx`](../../app/(store)/shop/experience/components/ArtworkInfoBar.tsx) — build reel list; video/poster thumbs + right-rail stack.
- [x] [`app/(store)/shop/experience/components/SplineFullScreen.tsx`](../../app/(store)/shop/experience/components/SplineFullScreen.tsx) — render image vs `ArtistCollectionVideoEmbed` per item.
- [x] [`app/(store)/shop/experience/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) — state typing for gallery items.
- [x] [`app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) — same.

## Verification

- Product with `media` VIDEO + images: scroll reel — video block appears immediately after artwork details, before extra photos.
- Thumbnail for first reel slot shows poster + play affordance when applicable.
