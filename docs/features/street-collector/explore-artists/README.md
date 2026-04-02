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

- **Card bios & profile copy (voice + AI rules):** [`artist-profile-copywriting-playbook.md`](../artist-profile-copywriting-playbook.md) — canonical standard for hooks, long bios, and short list blurbs.
- **Catalog / images / counts**: `getShopArtistsList()` (Shopify products + Supabase vendors + vendor meta), same payload as `GET /api/shop/artists`.
- **Featured order + city line on cards**: `streetCollectorContent.featuredArtists.collections` (handles + optional `location`). Not parsed from markdown at runtime.
- **Long-form enriched export (reference)**: [`docs/features/street-collector/artists.md`](../artists.md) — keep in sync with seed + export scripts when validating bios and metadata.

## SEO

- Metadata in `page.tsx`: title/description, Open Graph, Twitter, `alternates.canonical: '/explore-artists'`.
- `metadataBase` uses `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL` when set.

## Testing

- Manual: open `/explore-artists` (redirects to `/shop/explore-artists`), confirm grid, profile links (`/shop/artists/[slug]`), sticky CTA to `/experience`, home-v2 “View all artists” and final CTA “Explore the artists”.
- Artist lightbox: open an artist card; confirm **Works on Street Collector** loads thumbnails (from `GET /api/shop/artists/[slug]?vendor=…`) and links to `/shop/[handle]`.
- `prefers-reduced-motion`: scroll reveal hooks show content immediately (home-v2 pattern).

## Typography (shared with home-v2 + artist profile)

- Stack matches reference `artist-profile.html`: **Playfair Display** (editorial), **DM Mono** (body, labels, UI), **Bebas Neue** (display numerals, prices).
- Implementation: [`app/(store)/shop/home-v2/landing-fonts.ts`](../../../../app/(store)/shop/home-v2/landing-fonts.ts) (`next/font/google`), CSS variables `--font-landing-serif|mono|display`.
- Tailwind (when font variables are on an ancestor): `font-landing-serif`, `font-landing-mono`, `font-landing-display` in [`tailwind.config.ts`](../../../../tailwind.config.ts).

## Change log

| Version | Date | Notes |
|---------|------|--------|
| 1.1.5 | 2026-04-03 | Optional Instagram **Business Discovery** in `GET /api/shop/artists/[slug]` when caller id + token set (`INSTAGRAM_BUSINESS_DISCOVERY_IG_USER_ID` **or** `INSTAGRAM_BUSINESS_ID`; `INSTAGRAM_ACCESS_TOKEN` **or** `INSTAGRAM_MANUAL_ACCESS_TOKEN`). Fills grid if `instagram_showcase` empty. See [`artist-profile-content-spec.md`](../artist-profile-content-spec.md) §7. |
| 1.1.4 | 2026-04-03 | Instagram tab: **native** grid from `custom.instagram_showcase` image URLs only (no iframe); optional per-tile `link`; empty state + profile CTA when no images. See [`artist-profile-content-spec.md`](../artist-profile-content-spec.md) §7. |
| 1.1.3 | 2026-04-03 | ~~Iframe embed~~ (removed in 1.1.4). |
| 1.1.2 | 2026-04-03 | Typography aligned with `artist-profile.html`: removed Inter from landing stack; body uses DM Mono; display roles use Bebas; Playfair weights 400/500/700. Artist slug layout injects font variables ([`app/(store)/shop/artists/[slug]/layout.tsx`](../../../../app/(store)/shop/artists/[slug]/layout.tsx)). |
| 1.1.1 | 2026-04-02 | Artist profile **Instagram** tab ([`ArtistProfilePageClient`](../../../../app/(store)/shop/artists/[slug]/ArtistProfilePageClient.tsx)): embedded profile preview via `instagram.com/{handle}/embed/` when `vendors.instagram_url` or collection metafield supplies a handle; CSP `frame-src` updated. Curated vendor URLs: [`supabase/migrations/20260402140000_vendor_instagram_urls_street_collector.sql`](../../../../supabase/migrations/20260402140000_vendor_instagram_urls_street_collector.sql). |
| 1.1.0 | 2026-04-02 | Lightbox loads that artist’s storefront products (artist API + product links). House vendor **Street Collector** excluded from `getShopArtistsList()` / explore grid. |
| 1.0.0 | 2026-03-31 | Initial explore page, shared `getShopArtistsList`, middleware short URL, home-v2 wiring. |
