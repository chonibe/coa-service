# Commit log: spotlight vendor filter only when card expanded

**Date:** 2026-03-24

## Checklist

- [x] [`app/(store)/shop/experience-v2/components/Configurator.tsx`](../../app/(store)/shop/experience-v2/components/Configurator.tsx) — `spotlightExpanded` state drives banner UI; `handleSpotlightSelect` sets it; sync collapse when `spotlightData.vendorName` removed from `filters.artists`; removed unused `handleToggleSpotlightFilter`; `initialFilters` still expands spotlight when parent pre-applies artists.
- [x] [`app/(store)/shop/experience-v2/components/ExperienceClient.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceClient.tsx) — Stopped resolving affiliate/URL slug to `initialFilters` via `/api/shop/artists` (avoided name mismatch vs spotlight `vendorName` leaving grid filtered while card looked collapsed).
- [x] [`app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) — Same spotlight expansion state + sync effect; passes `spotlightBannerExpanded` to picker.
- [x] [`app/(store)/shop/experience/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) — Same as v2 client.
- [x] [`app/(store)/shop/experience/components/ArtworkPickerSheet.tsx`](../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) — Optional `spotlightBannerExpanded` overrides derived `expanded` from filters.

## Behavior

- Collapsed spotlight: no automatic vendor filter from spotlight; grid shows full filtered season (subject to other filters).
- Expanded spotlight: adds `spotlightData.vendorName` to artist filters (existing logic).
- Affiliate `?artist=` still loads the correct spotlight via `initialArtistSlug`; users opt into filtering by expanding the card.
