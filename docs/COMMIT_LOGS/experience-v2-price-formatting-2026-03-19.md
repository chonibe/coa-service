# Experience V2 Price Formatting – 2026-03-19

**Branch:** main

## Summary

Unified price display across experience-v2: 1 decimal when fractional, no decimal when whole, rounded to nearest $0.50.

## Changes Checklist

- [x] **formatPriceCompact** – Added to `lib/utils.ts`: rounds to nearest 0.5, hides decimal when whole
- [x] **OrderBar** – AnimatedPrice, lamp savings, lamp total, artwork prices use formatPriceCompact
- [x] **ExperienceCartChip** – Cart chip total uses formatPriceCompact
- [x] **ArtworkStrip** – Artwork prices and formatPrice helper use formatPriceCompact
- [x] **Configurator** – Lamp price, lamp total, lamp savings use formatPriceCompact
- [x] **DiscountCelebration** – Discount amount uses formatPriceCompact
- [x] **ArtworkDetail** – Artwork prices use formatPriceCompact
- [x] **ArtworkInfo** – Artwork price uses formatPriceCompact

## Files Modified

| File | Change |
|------|--------|
| `lib/utils.ts` | Added formatPriceCompact(amount) |
| `app/(store)/shop/experience-v2/components/OrderBar.tsx` | Price displays |
| `app/(store)/shop/experience-v2/ExperienceCartChip.tsx` | Cart chip total |
| `app/(store)/shop/experience-v2/components/ArtworkStrip.tsx` | Artwork prices |
| `app/(store)/shop/experience-v2/components/Configurator.tsx` | Lamp prices |
| `app/(store)/shop/experience-v2/components/DiscountCelebration.tsx` | Discount amount |
| `app/(store)/shop/experience-v2/components/ArtworkDetail.tsx` | Artwork prices |
| `app/(store)/shop/experience-v2/components/ArtworkInfo.tsx` | Artwork price |

## Technical Notes

- `formatPriceCompact`: `Math.round(amount * 2) / 2` for nearest 0.5, then `toFixed(1).replace(/\.0$/, '')` for display
- Examples: $25.37 → $25.5, $25.12 → $25, $25.00 → $25
