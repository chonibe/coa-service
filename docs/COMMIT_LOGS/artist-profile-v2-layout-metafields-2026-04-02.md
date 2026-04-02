# Artist profile v2 layout + collection metafields — 2026-04-02

## Summary

Rebuilt `/shop/artists/[slug]` to match the `artist-profile.html` structure (hero, sticky tabs, overview / works / exhibitions+press / Instagram, related artists, CTA). Extended Shopify **collection** Storefront fragment with `custom.*` metafields for rich content; API now returns `profile`, `stats`, and `instagramUrl` (Instagram from Supabase vendor URL **or** `custom.instagram` on the collection). Added [`docs/features/street-collector/artist-profile-content-spec.md`](../features/street-collector/artist-profile-content-spec.md) as the authoring checklist.

## Checklist of Changes

- [x] [`lib/shopify/storefront-client.ts`](../../lib/shopify/storefront-client.ts) — collection metafields for artist profile; `ProductCardFields` variants + `edition_size` + tags for artist grid stats
- [x] [`lib/shop/artist-profile-api.ts`](../../lib/shop/artist-profile-api.ts) — `buildArtistProfileResponse`, `ArtistProfileApiResponse`, JSON parsing helpers
- [x] [`app/api/shop/artists/[slug]/route.ts`](../../app/api/shop/artists/[slug]/route.ts) — all success paths return enriched payload
- [x] [`app/(store)/shop/artists/[slug]/ArtistProfilePageClient.tsx`](../../app/(store)/shop/artists/[slug]/ArtistProfilePageClient.tsx) — new UI
- [x] [`app/(store)/shop/artists/[slug]/artist-profile.module.css`](../../app/(store)/shop/artists/[slug]/artist-profile.module.css) — layout CSS
- [x] [`app/(store)/shop/artists/[slug]/page.tsx`](../../app/(store)/shop/artists/[slug]/page.tsx) — fetch + loading/not-found + client handoff
- [x] [`docs/features/street-collector/artist-profile-content-spec.md`](../features/street-collector/artist-profile-content-spec.md) — content + metafield map
