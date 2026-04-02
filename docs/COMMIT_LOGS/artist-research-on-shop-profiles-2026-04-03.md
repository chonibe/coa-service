# Commit log — Research on shop artist profiles (2026-04-03)

## Checklist

- [x] [content/artist-research-data.json](../../content/artist-research-data.json) — Generated from [docs/features/street-collector/artist-research-sheet.csv](../features/street-collector/artist-research-sheet.csv); keyed by collection slug (+ aliases from `thestreetcollector.com/collections/...` in Sources).
- [x] [scripts/csv_to_artist_research_json.py](../../scripts/csv_to_artist_research_json.py) — Regenerator; run `npm run research:json` after CSV edits.
- [x] [lib/shop/artist-research-merge.ts](../../lib/shop/artist-research-merge.ts) — Merges research into `ArtistProfileRich` when Shopify metafields are empty; parses press/exhibitions; skips non-image URLs for process/showcase.
- [x] [lib/shop/artist-profile-api.ts](../../lib/shop/artist-profile-api.ts) — `buildArtistProfileResponse` applies research (profile, bio, Instagram fallback).
- [x] [lib/shop/artists-list.ts](../../lib/shop/artists-list.ts) — Listings / explore use research bio + Instagram when Supabase/Shopify omit them.
- [x] [app/(store)/shop/artists/[slug]/ArtistProfilePageClient.tsx](../../app/(store)/shop/artists/[slug]/ArtistProfilePageClient.tsx) — `bioParagraphs` preserves `\n\n` paragraph breaks for overview story.

## Precedence

Shopify collection metafields and Supabase vendor fields win when set; research fills gaps only.
