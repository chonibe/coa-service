# Commit log: Featured bundle thumbnails add to cart (2026-04-06)

## Summary

The featured artist bundle card under the Spline reel (lamp + two prints) now uses **clickable thumbnails**. Tapping the lamp ensures the Street Lamp is in the cart; tapping a print adds that artwork if it is available and not already in the cart. Behavior matches the existing “Add to cart” bundle CTA for filter/spotlight context (expand spotlight, close filter sheet, price bump animation).

## Checklist

- [x] [`FeaturedArtistBundleSection.tsx`](../../app/(store)/shop/experience/components/FeaturedArtistBundleSection.tsx) — Portrait thumbs render as accessible buttons when handlers are provided; disabled when `offer.disabled` or print unavailable.
- [x] [`SplineFullScreen.tsx`](../../app/(store)/shop/experience/components/SplineFullScreen.tsx) — Optional `onFeaturedBundleThumbnailAddLamp` / `onFeaturedBundleThumbnailAddArtwork` passed into the bundle section.
- [x] [`ExperienceV2Client.tsx` (experience-v2)](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) — Handlers: lamp qty ≥ 1, artwork add-only with analytics, lamp preview, carousel index, spotlight + filter close + `triggerPriceBump`.
- [x] [`ExperienceV2Client.tsx` (legacy experience)](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) — Same wiring for the non–v2 shell.

## Testing

- ESLint on updated bundle/Spline files.
- Manual: empty collection → featured bundle visible → tap each thumb and confirm cart / preview updates; confirm thumbs non-interactive when bundle CTA is disabled.

## Deployment

- Production deploy via `vercel --prod --yes` after commit (per project rules).
