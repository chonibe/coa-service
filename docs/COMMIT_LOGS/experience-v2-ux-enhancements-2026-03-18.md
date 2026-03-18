# Experience V2 UX Enhancements – 2026-03-18

## Summary
Experience page refinements: artist spotlight preselection, carousel/slider UX, artwork chips, and header logo placement.

## Checklist of Changes

- [x] [`app/(store)/shop/experience/page.tsx`](../../app/(store)/shop/experience/page.tsx) – Pass `initialArtistSlug` from URL `searchParams` (?artist=, ?vendor=) to ExperienceV2Client
- [x] [`app/(store)/shop/experience/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) – Preselect artist's 2 latest works when visiting via ?artist= (add to cart only, not on lamp); fetch spotlight with ?artist=; merge spotlight products for early-access
- [x] [`app/api/shop/artist-spotlight/route.ts`](../../app/api/shop/artist-spotlight/route.ts) – Return `products` array when ?artist= for preselection; extend SpotlightResult type
- [x] [`app/(store)/shop/experience/components/ArtworkPickerSheet.tsx`](../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) – Add Featured Artist / Early Access chips to ArtworkCardV2; spotlight product detection
- [x] [`app/(store)/shop/experience/components/ArtworkCarouselBar.tsx`](../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) – Remove duplicate + button; move + inline with artwork blocks; align + at bottom with items-end; desktop: center when few items, scroll to end when many; fix spacer alignment
- [x] [`app/(store)/shop/experience-v2/ExperienceSlideoutMenu.tsx`](../../app/(store)/shop/experience-v2/ExperienceSlideoutMenu.tsx) – Add round logo (Group_707) before hamburger; absolute center of top bar; same vertical alignment as hamburger/cart
- [x] Experience folder structure – experience-v2 components moved/consolidated; experience uses ExperienceV2Client with new ArtworkCarouselBar, ArtworkPickerSheet, SplineFullScreen

## Related Files
- [`docs/features/experience-v2/README.md`](../../docs/features/experience-v2/README.md)
- [`docs/features/experience/README.md`](../../docs/features/experience/README.md)
