# Commit log: Featured bundle print thumbs — `availableForSale` fix (2026-04-06)

## Problem

Print tiles in the featured bundle card rendered as plain `<div>` + `<img>` (not `<button>`) when `availableForSale` was **missing** on the product object. The code used truthy checks (`p.availableForSale`), while the lamp tile already used `!== false` so unknown availability still allowed interaction.

## Changes

- [x] [`FeaturedArtistBundleSection.tsx`](../../app/(store)/shop/experience/components/FeaturedArtistBundleSection.tsx) — `printAddable` uses `p.availableForSale !== false`; optional `pointer-events-none` on the image inside clickable thumbs so taps target the button reliably.
- [x] [`ExperienceV2Client.tsx` (v2)](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) — `handleFeaturedBundleThumbAddArtwork` skips only when `availableForSale === false`.
- [x] [`ExperienceV2Client.tsx` (legacy)](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) — same handler guard.

## Deployment

Production via `vercel --prod --yes` after commit.
