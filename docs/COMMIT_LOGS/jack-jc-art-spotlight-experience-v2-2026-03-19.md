# Jack J.C. Art Default Spotlight, ?artist= Support for Experience V2 – 2026-03-19

## Summary
Set Jack J.C. Art as the default artist spotlight and add `?artist=` URL parameter support to the experience-v2 page so affiliate links work on both experience routes.

## Checklist of Changes

- [x] [`app/api/shop/artist-spotlight/route.ts`](../../app/api/shop/artist-spotlight/route.ts) – Jack J.C. Art as default spotlight (handles: jack-jc-art, jack-j-c-art); remove Tyler Shelton priority; add handle variant jack-jc-art → jack-j-c-art for ?artist= lookup
- [x] [`app/(store)/shop/experience-v2/page.tsx`](../../app/(store)/shop/experience-v2/page.tsx) – Read ?artist= and ?vendor= from searchParams; pass initialArtistSlug to loader
- [x] [`app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) – Accept initialArtistSlug; fetch spotlight by artist when present; merge spotlight products into season when from artist link
- [x] [`app/(store)/shop/experience-v2/components/ExperienceV2ClientLoader.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceV2ClientLoader.tsx) – Add initialArtistSlug to props interface

## Related Files
- [`app/(store)/shop/experience-v2/components/ArtistSpotlightBanner.tsx`](../../app/(store)/shop/experience-v2/components/ArtistSpotlightBanner.tsx)
- [`app/(store)/shop/experience/page.tsx`](../../app/(store)/shop/experience/page.tsx) – Already supported ?artist=; unchanged
