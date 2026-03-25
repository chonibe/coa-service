# Commit log: artwork picker full grid + spotlight filter alignment

**Date:** 2026-03-25

## Checklist

- [x] [`app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) — `spotlightArtistVendorForFilter` from first spotlight product’s Shopify `vendor` (fallback API name); spotlight accordion adds/removes that key; opening the picker clears spotlight artist filters and collapses accordion (all carts).
- [x] [`app/(store)/shop/experience/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) — Same as v2 client.
- [x] [`app/(store)/shop/experience-v2/components/Configurator.tsx`](../../app/(store)/shop/experience-v2/components/Configurator.tsx) — Same vendor key for spotlight filter + affiliate-dismiss cookie check.
- [x] [`app/(store)/shop/experience/components/ArtworkPickerSheet.tsx`](../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) — “Explore full collection” and accordion expanded state follow `spotlightBannerExpanded` when provided (not only `filters.artists`).

## Behavior

- Artist filter for spotlight uses the same string as `product.vendor` so `applyFilters` does not return an empty grid when API `vendorName` differs from Shopify.
- Opening “Start your collection” resets spotlight accordion and removes spotlight-driven artist chips so the list shows the full season until the user expands the spotlight card again.
