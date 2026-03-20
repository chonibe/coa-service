# Merged two-card row — outline matches single selected cards — 2026-03-20

## Summary

Vendor-merge rows (two selected artworks, same vendor) now use the **same** outer chrome as a single selected card: **`border-2 border-[#FFBA94]/45`** and **`shadow-[inset_0_0_12px_rgba(255,186,148,0.1)]`**. Strip previously used `border` (1px) and solid `#FFBA94`; picker used solid peach — both aligned.

## Checklist

- [x] [`app/(store)/shop/experience/components/ArtworkPickerSheet.tsx`](../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) — merge wrapper classes
- [x] [`app/(store)/shop/experience-v2/components/ArtworkStrip.tsx`](../../app/(store)/shop/experience-v2/components/ArtworkStrip.tsx) — merge wrapper classes
- [x] [`docs/features/experience-v2/README.md`](../../docs/features/experience-v2/README.md) — note merged-row styling
