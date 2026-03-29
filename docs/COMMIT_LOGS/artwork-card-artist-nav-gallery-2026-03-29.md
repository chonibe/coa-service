# Commit log: Artwork card — artist above title, tap to artist slide

**Date:** 2026-03-29

## Summary

- [`HorizontalTwoSlideGallery.tsx`](../../app/(store)/shop/experience-v2/components/HorizontalTwoSlideGallery.tsx): React context + **`useHorizontalTwoSlideGallery()`** exposing `goToSlide` / `activeIndex` for children (e.g. first slide).
- [`ArtworkAccordions.tsx`](../../app/(store)/shop/experience/components/ArtworkAccordions.tsx): **`ArtworkCardHeading`** shows **artist above title**; in the two-slide gallery, the artist line is a **button** (chevron) that calls **`goToSlide(1)`** with `aria-label="View artist details"`.

## Checklist

- [x] Implementation — files above
- [ ] Manual: open experience reel with artwork+artist gallery — artist above title; tap artist → second slide (spotlight)
