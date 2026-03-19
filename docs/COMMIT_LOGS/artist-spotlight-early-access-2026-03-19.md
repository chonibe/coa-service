# Artist Spotlight Card, Bio Fetch Fix, Early Access Discount – 2026-03-19

## Summary
Replace artist bio accordion with spotlight card, fix artist details fetch when artists API fails, and enable early access discount on experience page.

## Checklist of Changes

- [x] [`app/(store)/shop/experience/components/ArtworkAccordions.tsx`](../../app/(store)/shop/experience/components/ArtworkAccordions.tsx) – Replace artist bio accordion with ArtistSpotlightBanner; use artist-spotlight as primary when artists API fails; store spotlight response for card
- [x] [`app/(store)/shop/experience-v2/components/ArtworkDetail.tsx`](../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx) – Replace artist bio accordion with ArtistSpotlightBanner in all layouts (desktop inline, slideout, mobile); use artist-spotlight as primary when artists API fails; remove carousel artist swap
- [x] [`app/(store)/shop/experience/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) – Add early access coupon fetch when ?artist=&token= in URL; add unlisted=1 to spotlight fetch when ?unlisted=1 for discount display

## Related Files
- [`app/(store)/shop/experience-v2/components/ArtistSpotlightBanner.tsx`](../../app/(store)/shop/experience-v2/components/ArtistSpotlightBanner.tsx)
- [`app/api/shop/early-access-coupon/route.ts`](../../app/api/shop/early-access-coupon/route.ts)
- [`app/api/shop/artist-spotlight/route.ts`](../../app/api/shop/artist-spotlight/route.ts)
