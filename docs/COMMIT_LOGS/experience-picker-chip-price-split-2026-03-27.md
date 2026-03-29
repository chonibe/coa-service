# Commit log: picker — Street chip vs list price split

**Date:** 2026-03-27

## Summary

Restored [`StreetPricingChip`](../../app/(store)/shop/experience-v2/components/StreetPricingChip.tsx) on picker artwork images. Chip shows **stage + subcopy only** (`showPrice={false}`); **USD list price** and **next bump** stay in the card footer so chip and price are separate without repeating the dollar amount in the pill.

## Checklist

- [x] [`app/(store)/shop/experience-v2/components/StreetPricingChip.tsx`](../../app/(store)/shop/experience-v2/components/StreetPricingChip.tsx) — Optional `showPrice` (default `true`); `title` still includes full info for hover.
- [x] [`app/(store)/shop/experience/components/ArtworkPickerSheet.tsx`](../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) — Chip on image + footer price + next bump only (no duplicate label/subcopy in footer).
- [x] [`docs/features/experience-v2/README.md`](../features/experience-v2/README.md) — Version note.
