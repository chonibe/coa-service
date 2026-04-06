# Commit log: collection `custom.video` above artwork carousel

**Date:** 2026-04-06

## Summary

Surfaces the Shopify **collection** metafield `custom.video` (admin name: Video) in the experience v2 artwork detail panel: the resolved URL renders **above** the image carousel (and above any product-native standalone video), for any vendor whose paired collection defines the metafield (e.g. Saturn).

## Checklist

- [x] Storefront `CollectionFields` — `videoMetafield: metafield(namespace: "custom", key: "video")` — [`lib/shopify/storefront-client.ts`](../../lib/shopify/storefront-client.ts)
- [x] Admin helpers — `Video` node in `resolveMediaGidToUrl`, `getCollectionVideoUrlByAdmin` — [`lib/shopify/admin-collection-products.ts`](../../lib/shopify/admin-collection-products.ts)
- [x] Vendor/collection merge — `videoUrl` + GID resolution — [`lib/shopify/vendor-meta.ts`](../../lib/shopify/vendor-meta.ts)
- [x] Spotlight API — `videoUrl` on JSON payload — [`app/api/shop/artist-spotlight/route.ts`](../../app/api/shop/artist-spotlight/route.ts)
- [x] UI types — `SpotlightData.videoUrl` — [`app/(store)/shop/experience-v2/components/ArtistSpotlightBanner.tsx`](../../app/(store)/shop/experience-v2/components/ArtistSpotlightBanner.tsx)
- [x] Embed — `ArtistCollectionVideoEmbed` (YouTube / Vimeo / direct & HLS) — [`app/(store)/shop/experience-v2/components/ProductStandaloneVideoEmbed.tsx`](../../app/(store)/shop/experience-v2/components/ProductStandaloneVideoEmbed.tsx)
- [x] Placement — desktop + mobile artwork detail — [`app/(store)/shop/experience-v2/components/ArtworkDetail.tsx`](../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx)

## Notes

- Storefront API must expose the metafield to the app (same pattern as `custom.gif`). File-reference values and Admin-only visibility are covered via Admin fallback + GID resolution where applicable.
