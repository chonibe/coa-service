---
title: "Shop Experience Page Documentation"
type: source
tags: [shop, 3d, spline, configurator, performance, ux]
created: 2026-04-14
updated: 2026-04-14
sources: []
---

# Shop Experience Page Documentation

Comprehensive technical documentation for the Spline 3D lamp configurator experience page, including performance optimisations and scroll/touch interaction fixes.

## Metadata

- **Author**: The Street Collector team
- **File**: `docs/features/experience/README.md`
- **Date**: Living document, last observed 2026-04-14

## Summary

The Experience page is the flagship shop feature: a 3D Street Lamp configurator where collectors choose artwork. The page uses Spline for the 3D model, `@tanstack/react-virtual` for the artwork strip, and Shopify Storefront API for product data. Performance was substantially improved in early 2026 with lazy Spline loading, virtualised artwork strip, and lightweight product payloads.

The scroll/touch interaction between the Spline WebGL canvas and normal page scrolling required 13 documented fixes. The solution: canvas has `pointer-events: none`, orbit controls are fully disabled, gesture direction is detected before routing to Spline rotation vs. page scroll.

The Featured Artist Bundle ($159) is a three-item bundle (spotlight + two prints) implemented in `ExperienceV2Client`.

## Key Takeaways

- Route: `app/(store)/shop/experience/` (and `experience-v2/` shell).
- `ArtworkCarouselBar` exists but is NOT mounted — do not add it without understanding why.
- Spline 3D: lazy-loaded, no orbit controls, no cursor follow. Idle yaw sway (±15° sine) when `animate` is enabled.
- Artwork strip: `@tanstack/react-virtual`, ~10–15 cards visible at once.
- Product data: `PRODUCT_LIST_FRAGMENT` for strip (lightweight), full product on detail open.
- Detail preload: cards entering viewport prefetch from `/api/shop/products/[handle]`.
- Scroll interaction fix: `pointer-events: none` on canvas, `touch-action: pan-y` on container, gesture direction detection.
- `reel-gallery-items-signature` content signature prevents spurious scroll resets when gallery images update.
- Gallery "Back to top" button: inline when Spline visible; docked pill when scrolled past Spline.
- Gallery sync: `onGalleryImagesChange` called when `galleryImages` memo updates (avoids fighting scroll).
- Strict tail extension: if new gallery images only append to the end, no `scrollIntoView` reset.
- Featured Artist Bundle: $159, implemented in `ExperienceV2Client`, documented in `experience-v2/README.md`.

## New Information

- `reelGalleryItemsSignature` from `lib/shop/experience-reel-gallery.ts` is the stable content hash preventing spurious resets.
- The `ignoreSlideSyncUntilRef` guard (with `scrollend` or 850ms timeout) prevents slide fights during programmatic `scrollIntoView` calls.
- `SplineFullScreen` passes `reelScrollContainerRef` to the reel's `overflow-y-auto` node so wheel deltas route correctly.
- The transparent layer above the canvas prevents WebGL from eating `wheel` events.

## Contradictions

None against other wiki pages.

## Entities Mentioned

- [[the-street-collector]]
- [[shopify]]

## Concepts Touched

- [[experience-page]]
- [[headless-architecture]]
- [[collector-dashboard]]
