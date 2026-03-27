# Experience: sticky checkout bar parity with `main` on feature branch (2026-03-27)

## Summary

Brought [`feat/granular-street-pricing-ladder`](../../) in line with production checkout UX: thumbnail row (lamps + artworks, `+` separators, overflow), shared lamp SVG, and `lamp` / `lampQuantity` wiring. Also restored desktop **`AddressModal`** phone `autoComplete="off"` (matches `main`).

## Checklist

- [x] [`app/(store)/shop/experience-v2/components/ExperienceOrderLampIcon.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceOrderLampIcon.tsx) — new shared glyph
- [x] [`app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx) — main-style sticky bar
- [x] [`app/(store)/shop/experience-v2/components/OrderBar.tsx`](../../app/(store)/shop/experience-v2/components/OrderBar.tsx) — use `ExperienceOrderLampIcon` instead of inline SVG
- [x] [`app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) — pass `lamp`, `lampQuantity`
- [x] [`app/(store)/shop/experience/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) — same props
- [x] [`components/shop/checkout/AddressModal.tsx`](../../components/shop/checkout/AddressModal.tsx) — `autoComplete={isMobile ? ac('tel') : 'off'}`
- [x] [`components/shop/checkout/AddressModal.test.tsx`](../../components/shop/checkout/AddressModal.test.tsx) — autocomplete assertions
- [x] [`docs/features/experience-v2/README.md`](../../docs/features/experience-v2/README.md) — architecture + version note

## Version

- 2026-03-27
