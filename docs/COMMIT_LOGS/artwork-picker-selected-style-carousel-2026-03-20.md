# Artwork picker / strip — selected style (full card) — 2026-03-20

## Summary

Selected (non-merged) artwork cards use a **full-card** highlight so the **image and title/price row** read as one unit:

- **`border-2 border-transparent`** on every card (no layout shift)
- When selected: **`border-[#FFBA94]/45`** on the outer wrapper
- Light **`inset` box-shadow** for a bit of inner warmth (visible especially on the frosted footer)

[`ArtworkPickerSheet`](../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) and [`ArtworkStrip`](../../app/(store)/shop/experience-v2/components/ArtworkStrip.tsx) stay aligned.

## Checklist

- [x] [`app/(store)/shop/experience/components/ArtworkPickerSheet.tsx`](../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) — `ArtworkCardV2` outer border + inset
- [x] [`app/(store)/shop/experience-v2/components/ArtworkStrip.tsx`](../../app/(store)/shop/experience-v2/components/ArtworkStrip.tsx) — same for `isInCart && !isMerged`
- [x] [`docs/features/experience-v2/README.md`](../../docs/features/experience-v2/README.md) — selected-state note

## Unchanged

Merged pair rows still use `border-2 border-[#FFBA94]` container styling.
