# Commit context: + unified with title chip (2026-03-28)

## Checklist

- [x] [ArtworkPickerSheet.tsx](../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) — Remove separate top-right glass `+`; render `Plus` as first child inside `picker-title-chip` when unselected; drop unused `useExperienceTheme` in `ArtworkCardV2`.
- [x] [ArtworkStrip.tsx](../../app/(store)/shop/experience-v2/components/ArtworkStrip.tsx) — Same inline chip: leading `+` when `!isInCart && !isSoldOut`.
- [x] [ArtworkCarouselBar.tsx](../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) — Spotlight placeholders: top glass row with `+` + truncated title; remove corner-only `+`.
- [x] [docs/features/experience/README.md](../../docs/features/experience/README.md) — v1.14.7.
- [x] [docs/features/experience-v2/README.md](../../docs/features/experience-v2/README.md) — Picker + carousel copy + changelog.

## Tests

- Picker: unselected cards show one chip with + and title; selected shows title only; selection number badge does not collide.
- Strip: not-in-cart shows + prefix; in cart hides +.
- Carousel spotlight tiles: compact title row with + at narrow width.
