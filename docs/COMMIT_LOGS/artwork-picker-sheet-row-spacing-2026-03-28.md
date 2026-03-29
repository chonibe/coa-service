# Commit context: artwork picker slide-up row spacing (2026-03-28)

## Checklist

- [x] [ArtworkPickerSheet.tsx](../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) — Row vertical gap: outer measured row uses `pb-12 md:pb-16` (single + two-up non-merge) or `py-4 md:py-6` (merged same-vendor pair); inner card row no longer uses tiny `pb-1.5` / `py-0.5`.
- [x] [ArtworkPickerSheet.tsx](../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) — `ROW_HEIGHT_ESTIMATE` 332 → 480 to match strip-scale rows and reduce virtualizer jump before measurement.
- [x] [ArtworkPickerSheet.tsx](../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) — Two-up row inner flex: `items-start` for alignment with strip.
- [x] [docs/features/experience/README.md](../../docs/features/experience/README.md) — Document that the slide-up list is separate from `ArtworkStrip` and gaps are kept in sync (v1.14.3).

## Why

Earlier spacing changes targeted `ArtworkStrip` only. The slide-up selector does not import it; spacing lived only in `ArtworkPickerSheet`, so users saw no change there.

## Tests

- Open `/shop/experience`, open the artwork picker sheet from the sticky bar, scroll the list — rows should show clearly larger vertical separation vs before.
