# Commit context: “Collection” arc label above add-artwork selector (2026-04-06)

**Commit:** `ccf34490c` — `feat(shop): curved Collection label above add-artwork + selector`

## Checklist

- [x] [CollectionArcLabel.tsx](../../app/(store)/shop/experience/components/CollectionArcLabel.tsx) — SVG `textPath` on a quadratic curve so “Collection” sits on an upward arc above the + control (`fab` vs `strip` sizing).
- [x] [ExperienceCheckoutStickyBar.tsx](../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx) — Wrap round add picker FAB with arc label (stacked column, `aria-hidden` on decoration; button keeps `aria-label`).
- [x] [ArtworkCarouselBar.tsx](../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) — Replace empty spacer row above violet strip + with the same arc label (`strip` variant).

## Notes

Theme-aware violet fills keep contrast on light/dark experience chrome. Decorative SVG only; primary action remains the existing buttons.
