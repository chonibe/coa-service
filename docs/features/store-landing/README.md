# Store landing (Street Collector homepage)

## Overview

Editorial, monochrome-forward landing for `/` and `/shop/street-collector`: split hero with optional “system” HUD, trust strip, how-it-works grid, product spec block, dark ritual band, artist carousel, testimonial carousel, limited-edition block, final CTA, FAQ.

## Implementation

| Area | Files |
|------|--------|
| Page composition | [`app/(store)/shop/street-collector/page.tsx`](../../../app/(store)/shop/street-collector/page.tsx) |
| Shell (promo + nav + mobile CTA) | [`app/(store)/shop/street-collector/StreetCollectorLandingShell.tsx`](../../../app/(store)/shop/street-collector/StreetCollectorLandingShell.tsx) |
| Top bar | [`app/(store)/shop/street-collector/DesktopTopBar.tsx`](../../../app/(store)/shop/street-collector/DesktopTopBar.tsx) |
| Sections | `EditorialHero.tsx`, `EditorialTrustStrip.tsx`, `HowItWorksStrip.tsx`, `ProductSpecBlock.tsx`, `RitualDarkBand.tsx`, `LimitedEditionBlock.tsx`, `EditorialFinalCta.tsx` (same folder) |
| Copy & media URLs | [`content/street-collector.ts`](../../../content/street-collector.ts) |
| Layout / theme | [`app/(store)/layout.tsx`](../../../app/(store)/layout.tsx), [`components/shop/street-collector/LandingThemeProvider.tsx`](../../../components/shop/street-collector/LandingThemeProvider.tsx) |

## Testing (manual)

- [ ] `/` and `/shop/street-collector` render without errors; fixed header clears hero.
- [ ] Nav links (LAMP, ARTWORKS, ARTISTS, …) resolve; slideout menu + theme toggle still work.
- [ ] Cart icon opens drawer; badge matches item count.
- [ ] Light/dark toggle: backgrounds and typography stay readable.
- [ ] Mobile sticky CTA matches primary editorial CTA.

## Version

- Last updated: 2026-04-28  
- Content version: tied to `street-collector.ts` and Shopify CDN assets referenced there.
