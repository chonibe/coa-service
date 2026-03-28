# Commit context: center artist spine vertically (2026-03-28)

## Checklist

- [x] [ArtworkPickerSheet.tsx](../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) — Two-up row: `items-start` → `items-stretch`; spine column `self-stretch` so vertical label centers in the row height.
- [x] [ArtworkStrip.tsx](../../app/(store)/shop/experience-v2/components/ArtworkStrip.tsx) — Same: explicit `items-stretch` on row, `self-stretch` on spine column.
- [x] [docs/features/experience/README.md](../../docs/features/experience/README.md) — Version note v1.14.4.

## Tests

- Open experience configurator two-up row and artwork picker sheet: artist name (vertical spine) should sit vertically centered relative to the paired cards.
