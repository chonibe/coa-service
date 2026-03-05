# Experience: Layout, ArtworkDetail & Filter UX

**Date**: 2026-03-04  
**Commit**: 3dd5ae92a

## Summary

Layout swap, larger ArtworkDetail panel, filter overlay, artists API update, and related experience polish.

## Changes Checklist

- [x] [`app/shop/experience/components/Configurator.tsx`](../../app/shop/experience/components/Configurator.tsx) — Layout: selector card left, 3D lamp right (`md:flex-row-reverse`); season tabs centered (desktop + mobile)
- [x] [`app/shop/experience/components/FilterPanel.tsx`](../../app/shop/experience/components/FilterPanel.tsx) — Filter slides in from left (`x: '-100%'`); fixed overlay on desktop (no page reload)
- [x] [`app/shop/experience/components/ArtworkDetail.tsx`](../../app/shop/experience/components/ArtworkDetail.tsx) — Desktop: larger panel (max-w-4xl); two-column layout (48% image, 52% info); scarcity bar + add button fixed at bottom of right column; About artist icon uses `allImages[0]`; Instagram link in About dropdown; price removed from header (kept in button)
- [x] [`app/api/shop/artists/[slug]/route.ts`](../../app/api/shop/artists/[slug]/route.ts) — Return `instagram` from vendors/collection metafield
- [x] [`app/shop/experience/page.tsx`](../../app/shop/experience/page.tsx) — Removed sort-by-vendor (BEST_SELLING); revert to default collection order
- [x] [`app/api/shop/experience/collection-products/route.ts`](../../app/api/shop/experience/collection-products/route.ts) — Removed best-selling vendor sort
- [x] [`app/shop/for-business/`](../../app/shop/for-business/) — New For Business page + API route
- [x] [`lib/shopify/artist-image.ts`](../../lib/shopify/artist-image.ts) — Artist image utilities
- [x] [`lib/shopify/vendor-bio.ts`](../../lib/shopify/vendor-bio.ts) — Vendor bio helper
- [x] [`docs/features/experience/README.md`](../../docs/features/experience/README.md) — Updated feature docs

## Features

### Layout
- Selector card on left, lamp on right (desktop)
- Season tabs centered on desktop and mobile

### Filter
- Overlay slides in from left
- Fixed overlay on desktop, no page reload when applying

### ArtworkDetail
- Larger desktop panel (max-w-4xl)
- Two-column: image carousel left (48%), info right (52%)
- Scarcity bar + add button fixed at bottom of right column
- About artist icon = first artwork image
- Instagram link in About dropdown
- Price only in button (removed from header)

### Artists API
- Returns `instagram` from vendors/collection metafield
