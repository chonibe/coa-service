# Artists List – Jack J.C. Art Image Override – 2026-03-25

## Summary
The shop artists list (`/api/shop/artists`) now forces Jack J.C. Art’s avatar to the Shopify collection image the team specified, so it no longer falls back to a wrong Supabase profile or product thumbnail.

## Checklist of Changes

- [x] [`lib/shopify/artist-image.ts`](../../lib/shopify/artist-image.ts) – `getArtistListImageOverride()`, `ARTIST_LIST_IMAGE_OVERRIDES` for Jack J.C. Art handle variants (plus `jack-ac-art` if that slug is used)
- [x] [`app/api/shop/artists/route.ts`](../../app/api/shop/artists/route.ts) – Apply list image override before `getVendorMeta` / `getArtistImageByHandle` chain

## Image URL
`https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/Screenshot_2026-03-08_at_13.41.17.png?v=1772970106`
