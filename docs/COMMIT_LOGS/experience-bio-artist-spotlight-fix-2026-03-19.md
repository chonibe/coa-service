# Experience Section Bio: Artist Spotlight as Primary – 2026-03-19

## Summary
Fix experience section bio to fetch from artist-spotlight API (same as selector) so bio data is consistent across selector and artwork detail/accordion.

## Checklist of Changes

- [x] [`app/(store)/shop/experience-v2/components/ArtworkDetail.tsx`](../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx) – Use artist-spotlight as primary; add slug variants (jack-j.c.-art → jack-jc-art, jack-j-c-art); fallback to artists API only when spotlight returns null
- [x] [`app/(store)/shop/experience/components/ArtworkAccordions.tsx`](../../app/(store)/shop/experience/components/ArtworkAccordions.tsx) – Same: artist-spotlight primary, slug variants, artists API fallback
- [x] [`app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) – Pass artistSlugOverride and spotlightDataOverride to ArtworkDetail when vendor matches spotlight
- [x] [`app/(store)/shop/experience-v2/components/Configurator.tsx`](../../app/(store)/shop/experience-v2/components/Configurator.tsx) – Only pass spotlight override when detailProduct.vendor matches spotlightData.vendorName
- [x] [`app/(store)/shop/experience/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) – Same vendor check for SplineFullScreen and ArtworkDetail

## Related Files
- [`app/api/shop/artist-spotlight/route.ts`](../../app/api/shop/artist-spotlight/route.ts)
- [`app/(store)/shop/experience-v2/components/ArtistSpotlightBanner.tsx`](../../app/(store)/shop/experience-v2/components/ArtistSpotlightBanner.tsx)
