# Commit log: Lamp ArtworkDetail — flat sections + 3:4 image

**Date:** 2026-04-06

## Checklist

- [x] [`app/(store)/shop/experience-v2/components/ArtworkDetail.tsx`](../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx) — `LampFlatDetailsSections`: Product details, What's included, Specifications always visible for `productIncludes` rows; **3:4** `aspect-[3/4]` on main image (mobile + desktop slideout + inline); prints unchanged (fixed height + accordions).
- [x] [`docs/features/experience-v2/README.md`](../../docs/features/experience-v2/README.md) — ArtworkDetail lamp behavior.

## Notes

- Mobile: lamp body content renders **below the hero image** (before tags / scarcity).
- Scroll-open nudge skipped for lamp (no accordion reveal).
