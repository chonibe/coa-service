# Commit log: Lamp selector CTA — Add lamp to cart + price

**Date:** 2026-04-06

## Checklist

- [x] [`app/(store)/shop/experience-v2/components/LampSelectorPromoBanner.tsx`](../../app/(store)/shop/experience-v2/components/LampSelectorPromoBanner.tsx) — Primary button **Add lamp to cart — $X** (`formatPriceCompact`); **Add lamp to cart** if price missing; `aria-label` for screen readers; removed duplicate price under title.
- [x] [`app/(store)/shop/experience-v2/components/LampSelectorPromoBanner.test.tsx`](../../app/(store)/shop/experience-v2/components/LampSelectorPromoBanner.test.tsx) — Query updated for new CTA.
- [x] [`docs/features/experience-v2/README.md`](../../docs/features/experience-v2/README.md) — Picker promo copy + changelog.

## Notes

- Picker and onboarding strip both use this component via [`ArtworkPickerSheet`](../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) and [`Configurator`](../../app/(store)/shop/experience-v2/components/Configurator.tsx).
