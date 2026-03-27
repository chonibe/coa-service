# Commit log: Experience checkout sticky bar (2026-03-27)

## Checklist

- [x] [`app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx) — New client component: shows when `selectedArtworks.length >= 1`, primary line `Title — Artist ✓`, optional `+n` for additional artworks, button `Checkout · $total →` calls `openOrderBar()`; total matches OrderBar (`orderSubtotal - promoDiscount`).
- [x] [`app/(store)/shop/experience/components/ArtworkCarouselBar.tsx`](../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) — Prop `reserveCheckoutBar` offsets the bottom strip so it sits above the sticky bar (safe-area aware).
- [x] [`app/(store)/shop/experience/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) — Renders sticky bar; passes `reserveCheckoutBar={selectedArtworks.length >= 1}` to carousel.
- [x] [`app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) — Same wiring for `/shop/experience-v2`.
- [x] [`docs/features/experience-v2/README.md`](../features/experience-v2/README.md) — Architecture + ExperienceV2Client integration notes.
- [x] [`docs/features/experience/README.md`](../features/experience/README.md) — Short pointer from shop experience doc.

## Testing

- ESLint on touched TSX files (no new errors).
- Manual: add artwork on `/shop/experience` or `/shop/experience-v2` → bar appears; tap Checkout → OrderBar opens; remove all artworks → bar hides; carousel remains usable above bar.

## Version

- Doc / feature note date: 2026-03-27
