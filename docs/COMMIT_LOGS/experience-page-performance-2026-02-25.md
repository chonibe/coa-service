# Experience Page Performance Optimization

**Date**: 2026-02-25

## Summary

Performance improvements for `/shop/experience` to reduce load time and dropoff.

## Checklist of Changes

- [x] Add `app/shop/experience/loading.tsx` with layout-matched skeleton
- [x] Refactor `page.tsx` for streaming: wrap data fetch in async component, use Suspense with fallback
- [x] Lazy-load Spline: replace static import in `Configurator.tsx` with `next/dynamic`
- [x] Add `PRODUCT_LIST_FRAGMENT` and `getCollectionWithListProducts` in `storefront-client.ts`
- [x] Update `page.tsx` to call `getCollectionWithListProducts` for both seasons
- [x] Use existing `GET /api/shop/products/[handle]` route for full product fetch
- [x] Update ArtworkDetail / Configurator to fetch full product on-demand when opening artwork detail; add loading state and caching
- [x] Install `@tanstack/react-virtual` and virtualize `ArtworkStrip.tsx`
- [x] Simplify Framer Motion on ArtworkCard (remove whileHover/whileTap)
- [x] Add error boundaries around Configurator and Spline
- [x] Document image optimization options and create `docs/features/experience/README.md`

## Files Modified

- `app/shop/experience/loading.tsx` (new)
- `app/shop/experience/page.tsx`
- `app/shop/experience/components/Configurator.tsx`
- `app/shop/experience/components/ExperienceClient.tsx`
- `app/shop/experience/components/ArtworkStrip.tsx`
- `app/shop/experience/components/ArtworkDetail.tsx`
- `lib/shopify/storefront-client.ts`
- `docs/features/experience/README.md` (new)
