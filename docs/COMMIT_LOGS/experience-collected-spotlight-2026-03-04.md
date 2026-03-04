# Experience: Collected Artworks & Artist Spotlight

**Date**: 2026-03-04

## Summary

Adds two experience enhancements: (1) Collected artworks indication for logged-in users with orders, and (2) Artist Spotlight banner for the most recent vendor new drop.

## Changes Checklist

- [x] [`app/api/shop/collected-products/route.ts`](../../app/api/shop/collected-products/route.ts) — New API: returns product IDs user owns from orders (for Collected badge)
- [x] [`app/api/shop/artist-spotlight/route.ts`](../../app/api/shop/artist-spotlight/route.ts) — New API: returns most recent vendor new drop (Shopify most recently created product first, Supabase artwork_series_members fallback)
- [x] [`app/shop/experience/components/ArtworkStrip.tsx`](../../app/shop/experience/components/ArtworkStrip.tsx) — Collected icon + New Drop badge on artwork cards
- [x] [`app/shop/experience/components/Configurator.tsx`](../../app/shop/experience/components/Configurator.tsx) — Fetch collected IDs & spotlight, pass to ArtworkStrip, ArtistSpotlightBanner, filter logic
- [x] [`app/shop/experience/components/ArtistSpotlightBanner.tsx`](../../app/shop/experience/components/ArtistSpotlightBanner.tsx) — New component: expandable banner with artist info, filter toggle, artwork thumbnails
- [x] [`app/shop/experience/components/OrderBar.tsx`](../../app/shop/experience/components/OrderBar.tsx) — Collected badge on order items user already owns
- [x] [`app/shop/experience/ExperienceOrderContext.tsx`](../../app/shop/experience/ExperienceOrderContext.tsx) — Add collectedProductIds to OrderBarContextProps
- [x] [`docs/features/experience/README.md`](../../docs/features/experience/README.md) — Document Collected Artworks and Artist Spotlight features

## Features

### 1. Collected Artworks

- **When**: User is logged in (Supabase auth) and has orders
- **Selector**: Green "Collected" badge with Package icon on artwork cards user owns
- **OrderBar**: Small collected icon + "(Collected)" label on artworks in cart that user already owns
- **Data**: `orders` + `order_line_items_v2` (status=active), matched by `customer_email`

### 2. Artist Spotlight Banner

- **Definition**: Most recent vendor to have artworks added (latest `artwork_series_members.created_at`)
- **Banner**: Expandable card above artwork strip with artist image, name, series
- **Dropdown**: Filter toggle, artist bio, thumbnails of artworks in the drop
- **Filter**: Adds spotlight vendor to artists filter when toggled
- **Badge**: "New Drop" on artwork cards in the spotlight series

## API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/shop/collected-products` | Product IDs user owns (authenticated) |
| `GET /api/shop/artist-spotlight` | Most recent vendor new drop with productIds, bio, image |

## Version

- Experience README: 1.6.0 → 1.7.0
