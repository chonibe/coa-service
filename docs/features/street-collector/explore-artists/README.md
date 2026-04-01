# Explore artists (shop)

## Overview

Immersive **Explore the artists** directory at `/shop/explore-artists`, with a short public URL **`/explore-artists`** (middleware redirects to `/shop/explore-artists`). It lists all Shopify vendors with Supabase enrichment, matches the home-v2 landing look (typography, grain, dark palette), and surfaces **featured order + location** from the same lineage as the long-form catalog export.

## Implementation

| Area | Path |
|------|------|
| Page (SSR, metadata) | [`app/(store)/shop/explore-artists/page.tsx`](../../../../app/(store)/shop/explore-artists/page.tsx) |
| Client UI (grid, motion, sticky CTA) | [`app/(store)/shop/explore-artists/components/ExploreArtistsClient.tsx`](../../../../app/(store)/shop/explore-artists/components/ExploreArtistsClient.tsx) |
| Styles | [`app/(store)/shop/explore-artists/explore-artists.module.css`](../../../../app/(store)/shop/explore-artists/explore-artists.module.css) |
| Live artist list (shared with API) | [`lib/shop/artists-list.ts`](../../../../lib/shop/artists-list.ts) — `getShopArtistsList()` |
| Featured ordering + location | [`lib/shop/explore-artists-order.ts`](../../../../lib/shop/explore-artists-order.ts) — uses [`content/street-collector.ts`](../../../../content/street-collector.ts) `featuredArtists.collections` |
| Artists JSON API | [`app/api/shop/artists/route.ts`](../../../../app/api/shop/artists/route.ts) |
| Short URL | [`middleware.ts`](../../../../middleware.ts) — `/explore-artists` → `/shop/explore-artists` |
| Home-v2 links | [`content/home-v2-landing.ts`](../../../../content/home-v2-landing.ts) `urls.exploreArtists`; [`ArtistsWall`](../../../../app/(store)/shop/home-v2/components/ArtistsWall.tsx); [`FinalCta`](../../../../app/(store)/shop/home-v2/components/FinalCta.tsx) secondary CTA |

## Data sources

- **Catalog / images / counts**: `getShopArtistsList()` (Shopify products + Supabase vendors + vendor meta), same payload as `GET /api/shop/artists`.
- **Featured order + city line on cards**: `streetCollectorContent.featuredArtists.collections` (handles + optional `location`). Not parsed from markdown at runtime.
- **Long-form enriched export (reference)**: [`docs/features/street-collector/artists.md`](../artists.md) — keep in sync with seed + export scripts when validating bios and metadata.

## SEO

- Metadata in `page.tsx`: title/description, Open Graph, Twitter, `alternates.canonical: '/explore-artists'`.
- `metadataBase` uses `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL` when set.

## Testing

- Manual: open `/explore-artists` (redirects to `/shop/explore-artists`), confirm grid, profile links (`/shop/artists/[slug]`), sticky CTA to `/experience`, home-v2 “View all artists” and final CTA “Explore the artists”.
- `prefers-reduced-motion`: scroll reveal hooks show content immediately (home-v2 pattern).

## Change log

| Version | Date | Notes |
|---------|------|--------|
| 1.0.0 | 2026-03-31 | Initial explore page, shared `getShopArtistsList`, middleware short URL, home-v2 wiring. |
