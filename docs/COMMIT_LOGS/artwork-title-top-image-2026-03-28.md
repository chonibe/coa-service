# Commit context: artwork title at top of image (2026-03-28)

## Checklist

- [x] [ArtworkPickerSheet.tsx](../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) — Title + edition overlay: `bottom-0` → `top-0`; title first, edition below; padding clears featured/early-access chip, unselected `+`, and selection number badge.
- [x] [ArtworkStrip.tsx](../../app/(store)/shop/experience-v2/components/ArtworkStrip.tsx) — Same glass title chip on image top; removed duplicate title from meta footer; `pr-8` / `pr-10` clears info + wishlist controls.
- [x] [docs/features/experience/README.md](../../docs/features/experience/README.md) — v1.14.6.
- [x] [docs/features/experience-v2/README.md](../../docs/features/experience-v2/README.md) — Picker/strip card copy + changelog.

## Tests

- Picker: title and edition read clearly; no overlap with corner UI in light/dark, selected/unselected, featured chip on/off.
- Configurator strip: title on image; footer shows price/edition/actions without duplicate title.
