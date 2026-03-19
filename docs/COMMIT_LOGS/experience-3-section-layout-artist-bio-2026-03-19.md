# Experience: 3-Section Layout, Open Artist Bio & Artwork Details

**Date:** 2026-03-19  
**Commit:** 447e3f06d

## Summary

Redesigned the experience page with a 3-section scroll-snap layout, converted accordions to open containers, and improved the artist spotlight in the selector.

## Checklist

- [x] [`app/(store)/shop/experience/components/SplineFullScreen.tsx`](../../app/(store)/shop/experience/components/SplineFullScreen.tsx) — 3 snap sections: Spline preview, Accordion (artist bio + details), Gallery
- [x] [`app/(store)/shop/experience/components/SplineFullScreen.tsx`](../../app/(store)/shop/experience/components/SplineFullScreen.tsx) — Gallery skips first image (shown in artwork details)
- [x] [`app/(store)/shop/experience/components/ArtworkAccordions.tsx`](../../app/(store)/shop/experience/components/ArtworkAccordions.tsx) — Open containers for artist bio, artwork details (no accordions)
- [x] [`app/(store)/shop/experience/components/ArtworkAccordions.tsx`](../../app/(store)/shop/experience/components/ArtworkAccordions.tsx) — Artwork details: image, title, edition size, release date, scarcity bar; centered text
- [x] [`app/(store)/shop/experience/components/ArtworkAccordions.tsx`](../../app/(store)/shop/experience/components/ArtworkAccordions.tsx) — Hide Shopify product description from artwork details
- [x] [`app/(store)/shop/experience-v2/components/ArtistSpotlightBanner.tsx`](../../app/(store)/shop/experience-v2/components/ArtistSpotlightBanner.tsx) — Larger artist image, centered layout, optional `showBadge` prop
- [x] [`app/(store)/shop/experience-v2/components/ArtistSpotlightBanner.tsx`](../../app/(store)/shop/experience-v2/components/ArtistSpotlightBanner.tsx) — Artist bio: name + bio only (no "Artist Spotlight" label in bio section)
- [x] [`app/(store)/shop/experience-v2/components/Configurator.tsx`](../../app/(store)/shop/experience-v2/components/Configurator.tsx) — Show Artist Spotlight/Early access badge in selector
- [x] [`app/(store)/shop/experience/components/ArtworkPickerSheet.tsx`](../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) — Show badge in picker
- [x] [`app/(store)/shop/experience/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) — Section count and gallery offset for 3-section layout
- [x] [`app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) — Same section layout updates

## Features

- **3-section scroll snap**: Page snaps into Spline preview, Artist bio + Artwork details, Gallery
- **Open containers**: Artist bio and artwork details always visible (no expand/collapse)
- **Artwork details**: Image, title, edition size, release date, scarcity bar; centered; no Shopify description
- **Gallery**: Skips first image (artwork image shown in details); shows remaining images
- **Artist spotlight badge**: "Artist Spotlight" or "Early access" badge in selector (Configurator, ArtworkPickerSheet); no badge in artist bio section
