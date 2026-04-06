# Commit log: Mobile sticky checkout thumbnails select Spline preview (2026-04-06)

## Checklist

- [x] [`ExperienceCheckoutStickyBar.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx) — Added **`onSelectThumbnailForSpline`** and **`previewSelectedProductId`**; **`StickyThumb`** uses a single tappable control for lamp + artwork when the callback is set (priority over **`onViewLampDetail`** on lamp); **`ring-2` / `aria-current`** for the active preview product.
- [x] [`ExperienceV2Client.tsx` (v2)](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) — **`handleStickyThumbnailSplineSelect`** resolves carousel index via **`carouselSlotIndexForProductId(cartOrder, product.id)`** and calls **`handleTapCarouselItem`**; wired when **`isMobile && !splineInView`**.
- [x] [`ExperienceV2Client.tsx` (legacy)](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) — Same pattern with **`activeStripProducts.findIndex`**; **`onViewLampDetail`** on sticky bar for desktop lamp detail parity.
- [x] [`docs/features/experience-v2/README.md`](../features/experience-v2/README.md) — Sticky bar behavior + changelog line.
- [x] [`docs/features/experience/README.md`](../features/experience/README.md) — Overview note for mobile thumbnail → Spline.

## QA

- **Mobile** (viewport under `md`): with cart art, scroll until sticky shows thumbnails (`splineInView` false); tap lamp and artwork thumbs — main Spline / reel selection should match carousel taps.
- **Desktop**: lamp thumb on v2 still opens lamp detail where **`onViewLampDetail`** is passed; artwork thumbs remain non-interactive when spline callback is not passed.
- While **`suppressCartThumbnails`** (carousel visible): sticky has no thumb row — no change.

## Tests

- Manual verification recommended (touch targets + scroll state). No new automated test in this change.
