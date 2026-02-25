# Experience Carousel & Slideshow Fixes

**Date:** 2026-02-25  
**Commit:** e4a1243fa  
**Type:** Fix + Enhancement  
**Status:** ✅ Complete

---

## Summary

Fixes carousel drag getting stuck and adds auto-rotate slideshow for product images when the user hasn't interacted. Includes ArtworkDetail UX improvements (scarcity bar, layout) and API sort-key fix for Storefront API compatibility.

---

## Implementation Checklist

- [x] [`app/shop/experience/components/ArtworkDetail.tsx`](../app/shop/experience/components/ArtworkDetail.tsx) – Fix carousel drag: `dragMomentum={false}`, reduced `dragElastic`, snap-back via `animate(dragX, 0)` on insufficient swipe
- [x] [`app/shop/experience/components/ArtworkDetail.tsx`](../app/shop/experience/components/ArtworkDetail.tsx) – Add auto-rotate slideshow (4s interval) when `!hasUserInteracted` and not showing artist
- [x] [`app/shop/experience/components/ArtworkDetail.tsx`](../app/shop/experience/components/ArtworkDetail.tsx) – Add `goToIndex` helper; wire dots, thumbnails, keyboard arrows to use it (stops slideshow on manual nav)
- [x] [`app/shop/experience/components/ArtworkDetail.tsx`](../app/shop/experience/components/ArtworkDetail.tsx) – Reset `hasUserInteracted` when `product.id` changes
- [x] [`app/api/shop/artists/[slug]/route.ts`](../app/api/shop/artists/[slug]/route.ts) – `CREATED_AT` → `CREATED` for `ProductCollectionSortKeys`
- [x] [`app/api/shop/collections/[handle]/route.ts`](../app/api/shop/collections/[handle]/route.ts) – `CREATED_AT` → `CREATED` for `ProductCollectionSortKeys`
- [x] [`app/shop/products/page.tsx`](../app/shop/products/page.tsx) – Map `CREATED_AT` → `CREATED` for collection sort
- [x] [`lib/shopify/storefront-client.ts`](../lib/shopify/storefront-client.ts) – Update `ProductCollectionSortKeys` type

---

## Technical Details

### Carousel Drag

- `dragMomentum={false}` – prevents momentum from causing stuck state
- `dragElastic={0.2}` – reduced from 0.35 for snappier response
- `handleDragEnd`: velocity + offset thresholds; calls `animate(dragX, 0, { type: 'spring', stiffness: 400, damping: 40 })` when swipe below threshold

### Slideshow

- Interval: 4 seconds
- Conditions: `!hasUserInteracted`, `!showingArtistInCarousel`, `allImages.length > 1`
- Any manual interaction (dots, thumbnails, keyboard, drag) sets `hasUserInteracted` and stops slideshow

### API Fix

- Shopify Storefront API expects `CREATED`, not `CREATED_AT`, for `ProductCollectionSortKeys`

---

## Files Changed

| File | Change |
|------|--------|
| `app/shop/experience/components/ArtworkDetail.tsx` | Carousel, slideshow, goToIndex wiring |
| `app/api/shop/artists/[slug]/route.ts` | CREATED sort key |
| `app/api/shop/collections/[handle]/route.ts` | CREATED sort key |
| `app/shop/products/page.tsx` | CREATED mapping |
| `lib/shopify/storefront-client.ts` | ProductCollectionSortKeys type |
| + 16 other modified files | See full commit |

---

## Verification

- TypeScript/lints: clean
- Manual: carousel drag no longer sticks; slideshow advances when idle; dots/arrows stop slideshow
- API: collection queries no longer throw on sort

---

## Deployment Notes

- No migration required
- Push to main completed
