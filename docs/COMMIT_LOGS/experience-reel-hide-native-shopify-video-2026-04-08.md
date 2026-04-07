# Commit log: Hide native Shopify video from experience vertical reel

**Date:** 2026-04-08

## Summary

**Native** Storefront `VIDEO` (file / CDN) is **removed** from [`buildExperienceReelGalleryItems`](../../lib/shop/experience-reel-gallery.ts) so it no longer appears in thumbnails or the [`SplineFullScreen`](../../app/(store)/shop/experience/components/SplineFullScreen.tsx) scroll gallery. **External** embeds (`EXTERNAL_VIDEO`) stay. Product **detail slideout** still shows native video via [`ProductStandaloneVideoEmbed`](../../app/(store)/shop/experience-v2/components/ProductStandaloneVideoEmbed.tsx). [`SplineFullScreen`](../../app/(store)/shop/experience/components/SplineFullScreen.tsx) native `<video>` branch and `ShopifyInlineVideo` import were removed as dead code.

## Checklist

- [x] [`lib/shop/experience-reel-gallery.ts`](../../lib/shop/experience-reel-gallery.ts)
- [x] [`app/(store)/shop/experience/components/SplineFullScreen.tsx`](../../app/(store)/shop/experience/components/SplineFullScreen.tsx)

## Verification

- Product with native video: reel thumbs + vertical scroll show **images only**; open detail — native video still there.
- Product with YouTube/Vimeo: embed row still in reel when present.
