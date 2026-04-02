# Explore artists – lightbox artworks + hide Street Collector vendor – 2026-04-02

## Summary

The explore-artists artist lightbox now loads that artist’s storefront editions from the existing artist API and shows a grid of links to `/shop/[handle]`. The internal Shopify vendor **Street Collector** is excluded from `getShopArtistsList()` so it no longer appears in the explore grid or `GET /api/shop/artists`.

## Checklist of Changes

- [x] [`lib/shop/artists-list.ts`](../../lib/shop/artists-list.ts) – `HIDDEN_SHOP_VENDOR_NAMES` / `isHiddenShopVendor()`; filter before building `baseArtists`
- [x] [`app/(store)/shop/explore-artists/components/ExploreArtistsClient.tsx`](../../app/(store)/shop/explore-artists/components/ExploreArtistsClient.tsx) – fetch `GET /api/shop/artists/[slug]?vendor=…` when lightbox opens; **Works on Street Collector** grid with proxied images
- [x] [`app/(store)/shop/explore-artists/explore-artists.module.css`](../../app/(store)/shop/explore-artists/explore-artists.module.css) – `.lbArtworks*`, `.lightboxContent` `position: relative`
- [x] [`docs/features/street-collector/explore-artists/README.md`](../../docs/features/street-collector/explore-artists/README.md) – v1.1.0 changelog + testing note
