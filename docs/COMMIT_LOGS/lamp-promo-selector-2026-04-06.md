# Lamp promo in artwork selector — 2026-04-06

## Summary

When the experience cart has **no Street Lamp** (`lampQuantity === 0`), the **artist spotlight accordion** at the top of the picker and onboarding strip is replaced by a **lamp promo card**: instructional line (“Start with the lamp, then add your artworks.”), product title, price, **“Add the lamp to start my bundle”** CTA, and a header that opens **`ArtworkDetail`** (bottom sheet on mobile, side panel on desktop).

## Checklist

- [x] [`app/(store)/shop/experience-v2/components/LampSelectorPromoBanner.tsx`](../../app/(store)/shop/experience-v2/components/LampSelectorPromoBanner.tsx) — new promo UI + a11y `aria-label` on header
- [x] [`app/(store)/shop/experience-v2/components/LampSelectorPromoBanner.test.tsx`](../../app/(store)/shop/experience-v2/components/LampSelectorPromoBanner.test.tsx) — Jest + RTL: CTA, open detail, close detail
- [x] [`app/(store)/shop/experience/components/ArtworkPickerSheet.tsx`](../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) — props + conditional lamp vs spotlight; gate “Explore full collection” when lamp promo shows; **`filterPanelLamp`** destructuring fix for `FilterPanel`
- [x] [`app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) — pass lamp + handlers into picker
- [x] [`app/(store)/shop/experience/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) — same for legacy `/shop/experience`
- [x] [`app/(store)/shop/experience-v2/components/Configurator.tsx`](../../app/(store)/shop/experience-v2/components/Configurator.tsx) — lamp promo when no lamp and paywall off; spotlight when lamp in cart
- [x] [`docs/features/experience-v2/README.md`](../../docs/features/experience-v2/README.md) — ArtworkPickerSheet + diagram + changelog

## Notes

- **Configurator**: When **`showLampPaywall`** is active, existing **`LampGridCard`** flow is unchanged; promo appears after skip / when paywall is off and lamp quantity is still 0.
