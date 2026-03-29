# Commit log: Experience reel + detail gallery fix (2026-03-28)

## Summary

- **`/shop/experience`** — [`ArtworkAccordions`](../../app/(store)/shop/experience/components/ArtworkAccordions.tsx) now uses a horizontal **two-slide gallery** (artwork card ↔ artist spotlight) when both blocks apply, matching the intent of the detail sheet UX.
- **Transform-based gallery** — New shared [`HorizontalTwoSlideGallery`](../../app/(store)/shop/experience-v2/components/HorizontalTwoSlideGallery.tsx) uses `translate3d` instead of `overflow-x` scroll so prev/next works inside parents with `overflow-x-hidden` (previous scroll-snap implementation often did nothing).
- **`ArtworkDetail`** — [`ArtworkArtistDetailGallery`](../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx) composes the same component; `resetKey={product.id}` resets slide on product change.

## Checklist

- [x] [`HorizontalTwoSlideGallery.tsx`](../../app/(store)/shop/experience-v2/components/HorizontalTwoSlideGallery.tsx)
- [x] [`ArtworkDetail.tsx`](../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx)
- [x] [`ArtworkAccordions.tsx`](../../app/(store)/shop/experience/components/ArtworkAccordions.tsx)
- [x] [`docs/features/experience/README.md`](../../docs/features/experience/README.md) · [`docs/features/experience-v2/README.md`](../../docs/features/experience-v2/README.md)
