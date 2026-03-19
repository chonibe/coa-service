# Spotlight: Collapsible Banner, Artwork Thumbnails, Merge Products – 2026-03-19

## Summary
Make the selector spotlight collapsible again, show artwork thumbnails, and ensure Jack J.C. Art artworks appear by merging spotlight products from the API.

## Checklist of Changes

- [x] [`app/(store)/shop/experience-v2/components/ArtistSpotlightBanner.tsx`](../../app/(store)/shop/experience-v2/components/ArtistSpotlightBanner.tsx) – Collapsible banner: compact view (artist + thumbnails) vs expanded (full bio); artwork thumbnails in both states; expand filters to artist, collapse shows all
- [x] [`app/(store)/shop/experience-v2/components/Configurator.tsx`](../../app/(store)/shop/experience-v2/components/Configurator.tsx) – Merge spotlight products from API; pass expanded={isSpotlightFilterActive}
- [x] [`app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) – Merge spotlight products whenever API returns them; spotlightProducts fallback from API when empty
- [x] [`app/(store)/shop/experience/components/ArtworkPickerSheet.tsx`](../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) – Show spotlight when spotlightData + onSpotlightSelect (remove products check); pass expanded prop
- [x] [`app/(store)/shop/experience/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) – Merge spotlight products; spotlightProducts fallback from API

## Related Files
- [`app/(store)/shop/experience-v2/components/ArtistSpotlightBanner.tsx`](../../app/(store)/shop/experience-v2/components/ArtistSpotlightBanner.tsx)
- [`app/api/shop/artist-spotlight/route.ts`](../../app/api/shop/artist-spotlight/route.ts)
