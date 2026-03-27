# Commit log: Experience scarcity + carousel Street ladder (2026-03-27)

## Summary

Surface the same Street edition ladder context as the artwork picker (stage label, list price with early-access handling, subcopy, next-step chip) on the experience flow when an artwork is selected: under the scarcity progress bar and under each thumbnail in the bottom carousel (collection and watchlist).

## Checklist

- [x] Shared helpers: [`lib/shop/experience-street-ladder-display.ts`](../../lib/shop/experience-street-ladder-display.ts) — `formatStreetArtworkListPrice`, `formatStreetNextSalesChipText`, `buildStreetLadderForScarcity`
- [x] Early access helper: [`lib/shop/experience-spotlight-match.ts`](../../lib/shop/experience-spotlight-match.ts) — `experienceEarlyAccessForProduct`
- [x] UI: [`app/(store)/shop/experience-v2/components/StreetLadderScarcityAddon.tsx`](../../app/(store)/shop/experience-v2/components/StreetLadderScarcityAddon.tsx) — full scarcity add-on + `StreetLadderStripCaption` for carousel
- [x] [`ScarcityBadge`](../../app/(store)/shop/experience-v2/components/ScarcityBadge.tsx) — optional `streetLadder` (bar variant: unified + panel, loading, sold out)
- [x] [`ArtworkAccordions`](../../app/(store)/shop/experience/components/ArtworkAccordions.tsx) — `streetEdition` + `isEarlyAccess` → scarcity bar
- [x] [`SplineFullScreen`](../../app/(store)/shop/experience/components/SplineFullScreen.tsx) — `streetEditionRow`, `displayedProductEarlyAccess` → accordions (content stack only)
- [x] [`ArtworkDetail`](../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx) — `streetEdition` → artwork scarcity bars
- [x] [`ArtworkCarouselBar`](../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) — optional `getStreetLadderForProduct`
- [x] Orchestrators: [`experience/ExperienceV2Client`](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx), [`experience-v2/ExperienceV2Client`](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) — wiring + detail `isEarlyAccess` / `isNewDrop` parity
- [x] Picker refactor: [`ArtworkPickerSheet`](../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) imports shared ladder helpers
- [x] Docs: [`docs/features/experience-v2/README.md`](../features/experience-v2/README.md) version note

## Deployment

Run after merge: `vercel --prod --yes` (per project `.cursorrules`).
