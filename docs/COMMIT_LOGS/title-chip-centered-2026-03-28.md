# Commit context: center title + chip content (2026-03-28)

## Checklist

- [x] [ArtworkPickerSheet.tsx](../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) — Title row: `flex w-full items-center justify-center`, `text-center`, `max-w` reserves trailing `+` when unselected; overlay column `items-center`.
- [x] [ArtworkStrip.tsx](../../app/(store)/shop/experience-v2/components/ArtworkStrip.tsx) — Same; `max-w-full` title when no `+` (in cart / sold out).
- [x] [ArtworkCarouselBar.tsx](../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) — Spotlight chip: same centering pattern (`max-w-[calc(100%-1rem)]` for title + icon).
- [x] [docs/features/experience/README.md](../../docs/features/experience/README.md) — v1.14.9 note.
