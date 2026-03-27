# Commit log: picker — subtle next price + scarcity chip

**Date:** 2026-03-27

## Summary

Street ladder cards: image chip shows **stage label only**; **scarcity** (`subcopy`) moves to a **separate muted pill** under the list price. **Next list step** uses a quiet **`→ $X · N more sales`** line (no amber emphasis). [`StreetPricingChip`](../../app/(store)/shop/experience-v2/components/StreetPricingChip.tsx) gains optional `showSubcopy`.

## Checklist

- [x] [`app/(store)/shop/experience-v2/components/StreetPricingChip.tsx`](../../app/(store)/shop/experience-v2/components/StreetPricingChip.tsx) — `showSubcopy` (default `true`).
- [x] [`app/(store)/shop/experience/components/ArtworkPickerSheet.tsx`](../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) — `StreetNextStepHint`, footer scarcity chip, picker uses `showSubcopy={false}`.
- [x] [`docs/features/experience-v2/README.md`](../features/experience-v2/README.md) — Version note.
