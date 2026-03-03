# Commit Log: Experience Progressive Loading & Wishlist Disabled

**Date:** 2026-03-03  
**Branch:** main

## Summary

- [x] Disabled wishlist menu across the shop
- [x] Implemented progressive loading for experience artwork collections (initial 36, auto-load on scroll)
- [x] Auth, account, and misc updates from prior sessions

## Changes Checklist

### Wishlist Disabled
- [x] [`app/shop/layout.tsx`](../../app/shop/layout.tsx) – Removed WishlistDrawer, wishlist handlers, open-wishlist listener
- [x] [`app/shop/[handle]/page.tsx`](../../app/shop/[handle]/page.tsx) – Removed WishlistButton from product page
- [x] [`app/shop/home/HomeProductCard.tsx`](../../app/shop/home/HomeProductCard.tsx) – `showWishlist={false}`

### Experience Progressive Loading
- [x] [`app/shop/experience/page.tsx`](../../app/shop/experience/page.tsx) – Initial load 36 products, pass pageInfo to client
- [x] [`app/shop/experience/components/ExperienceClient.tsx`](../../app/shop/experience/components/ExperienceClient.tsx) – Accept and pass pageInfoSeason1/2
- [x] [`app/shop/experience/components/Configurator.tsx`](../../app/shop/experience/components/Configurator.tsx) – Product state, loadMoreForSeason, IntersectionObserver props to ArtworkStrip
- [x] [`app/shop/experience/components/ArtworkStrip.tsx`](../../app/shop/experience/components/ArtworkStrip.tsx) – hasMore, onLoadMore, auto-load sentinel
- [x] [`lib/shopify/storefront-client.ts`](../../lib/shopify/storefront-client.ts) – Added `after` param to getCollectionWithListProducts
- [x] [`app/api/shop/experience/collection-products/route.ts`](../../app/api/shop/experience/collection-products/route.ts) – New API for paginated collection products

### Other
- [x] Auth ensure-profile, Google auth routes, CORS, Supabase client
- [x] Account orders (billingAddress), mock-data
- [x] AuthSlideupMenu, login-client, signup
- [x] Address form, Mapbox autocomplete
- [x] ExperienceSlideoutMenu, home page
- [x] Docs and testing updates

## Deployment

After push: `vercel --prod --yes` (per .cursorrules)
