# Commit log: Artist profile — demo parity (images, exhibitions, timeline)

**Date:** 2026-04-02

## Checklist

- [x] [`lib/shop/instagram-embed.ts`](../../lib/shop/instagram-embed.ts) — Map Instagram post/reel permalinks to `/embed/` iframe URLs.
- [x] [`next.config.js`](../../next.config.js) — Allow `https://www.instagram.com` in CSP `frame-src` for embeds.
- [x] [`lib/shop/artist-research-merge.ts`](../../lib/shop/artist-research-merge.ts) — Merge research **with** Shopify for process gallery, exhibitions, press, and Instagram showcase (deduped); include IG permalinks in process/showcase; richer exhibition line parsing (type / title / venue / city).
- [x] [`app/(store)/shop/artists/[slug]/ArtistProfilePageClient.tsx`](../../app/(store)/shop/artists/[slug]/ArtistProfilePageClient.tsx) — Render IG embeds in Process + Instagram tabs; exhibition venue only when set; filter invalid years.
- [x] [`app/(store)/shop/artists/[slug]/artist-profile.module.css`](../../app/(store)/shop/artists/[slug]/artist-profile.module.css) — Timeline rail on exhibitions block; scaled iframe shells for process + IG grid.

## Why

The static demo (`artist-profile.html`) used direct images and structured exhibition rows. Production hid research when any Shopify array was non-empty, stripped IG URLs from galleries, and showed no vertical hierarchy for exhibitions. This aligns behavior with the demo where data exists (research CSV / metafields) and documents CSP needs for Instagram embeds.
