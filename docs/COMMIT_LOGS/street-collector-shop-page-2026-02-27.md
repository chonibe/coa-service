# Street Collector Shop Page

**Date:** 2026-02-27  
**Type:** Feature

## Summary

Added a Street Collector–inspired shop landing page as the default `/shop` route. The page mirrors the layout and structure of [thestreetcollector.com](https://thestreetcollector.com/).

## Implementation Checklist

- [x] Create `content/street-collector.ts` — Content config (hero, value props, testimonials, collection handles)
- [x] Create `StreetCollectorProductCarousel.tsx` — Product carousel with Quick Add (+ Quick add button)
- [x] Create `app/shop/street-collector/page.tsx` — Main page (hero, value props, testimonials, carousels, artists, final CTA)
- [x] Update `app/shop/page.tsx` — Redirect `/shop` to `/shop/street-collector`
- [x] Add `app/shop/street-collector/README.md` — Feature documentation

## Files Changed

| Action | Path |
|--------|------|
| Added | `content/street-collector.ts` |
| Added | `app/shop/street-collector/page.tsx` |
| Added | `app/shop/street-collector/StreetCollectorProductCarousel.tsx` |
| Added | `app/shop/street-collector/README.md` |
| Modified | `app/shop/page.tsx` (redirect target) |
| Added | `docs/COMMIT_LOGS/street-collector-shop-page-2026-02-27.md` |

## Technical Notes

- Uses existing `VideoPlayer`, `PressCarousel`, `ArtistCarousel`, `Spline3DViewer`
- `StreetCollectorProductCarousel` is a client component (cart add requires client context)
- Collection fallbacks: season-2 → 2025-edition; season-1 → homepage bestSellers handle
- Quick Add uses `CartContext.addItem()`; cart drawer opens on add
- Background `#f5f5f5`, primary CTA `#2c4bce`

## References

- [Street Collector](https://thestreetcollector.com/)
- [app/shop/street-collector/README.md](../../app/shop/street-collector/README.md)
- [lib/shop/CartContext.tsx](../../lib/shop/CartContext.tsx)
- [lib/shopify/storefront-client.ts](../../lib/shopify/storefront-client.ts)
