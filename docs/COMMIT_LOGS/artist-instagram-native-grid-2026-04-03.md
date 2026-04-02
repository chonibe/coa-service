# Commit log: Native Instagram tab (no iframe)

**Date:** 2026-04-03

## Checklist

- [x] [`ArtistProfilePageClient.tsx`](../../app/(store)/shop/artists/[slug]/ArtistProfilePageClient.tsx) — Grid uses `<img>` + links only; optional per-tile `link`; empty state (silhouette + copy + CTA) when no `instagram_showcase`.
- [x] [`artist-profile-api.ts`](../../lib/shop/artist-profile-api.ts) — `InstagramShowcaseItem.link` optional.
- [x] [`artist-profile.module.css`](../../app/(store)/shop/artists/[slug]/artist-profile.module.css) — Removed embed styles; added `.igNativeEmpty*`.
- [x] Removed [`InstagramProfileEmbed.tsx`](../../app/(store)/shop/artists/[slug]/InstagramProfileEmbed.tsx) (deleted).
- [x] [`next.config.js`](../../next.config.js) — Dropped `instagram.com` from `frame-src`.
- [x] [`artist-profile-content-spec.md`](../features/street-collector/artist-profile-content-spec.md) §7 — Documented `link` + native behavior.
- [x] [`explore-artists/README.md`](../features/street-collector/explore-artists/README.md) changelog 1.1.4.

## Ops

Populate **`custom.instagram_showcase`** with image URLs (Shopify CDN or any public `https` image). Optional **`link`** per item for post/Reel URLs; otherwise tiles open the profile.
