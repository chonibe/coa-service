# Commit log: experience v2 collection video visibility

**Date:** 2026-04-06

## Summary

Collection promo video (`custom.video` / `videoUrl`) could stay hidden in artwork detail because spotlight matching used the **list/minimal** `detailProduct` while the sheet rendered **resolved** `artworkDetailProduct` (full Storefront payload with correct `vendor`). Vendor-only matching then failed, so `spotlightDataOverride` was null until a refetch—easy to misread as “never shows.” The artist-spotlight refetch effect also omitted `product.id`, so same-vendor navigation could leave stale or empty local spotlight.

## Checklist (files)

- [x] [`app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) — `spotlightOverridesForProduct(artworkDetailProduct, …)` for `ArtworkDetail`.
- [x] [`app/(store)/shop/experience-v2/components/Configurator.tsx`](../../app/(store)/shop/experience-v2/components/Configurator.tsx) — same for inline + mobile drawer `ArtworkDetail`.
- [x] [`app/(store)/shop/experience-v2/components/ArtworkDetail.tsx`](../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx) — include `product.id` in artist-spotlight `useEffect` deps.
- [x] [`app/(store)/shop/experience-v2/components/ProductStandaloneVideoEmbed.tsx`](../../app/(store)/shop/experience-v2/components/ProductStandaloneVideoEmbed.tsx) — `aspect-video` shell + immediate `src` (`deferLoadMs={0}`) for direct/Shopify MP4 embeds in `ArtistCollectionVideoEmbed`.

## Verification

- Open a print whose collection has `custom.video` set; detail should show **Artist video** above the carousel when vendor/product matches spotlight (or after refetch).
- Desktop slideout + mobile sheet: section should reserve 16:9 space so the block is visible before metadata loads.
