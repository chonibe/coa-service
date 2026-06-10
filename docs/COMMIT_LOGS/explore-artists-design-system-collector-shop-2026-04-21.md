# Explore-artists design system on collector shop routes

**Date:** 2026-04-21  
**Type:** UI / consistency

## Summary

Collector shop surfaces (`/shop/street-collector`, `/shop/drops`, `/shop/reserve`) use the same visual system as [`/shop/explore-artists`](https://www.thestreetcollector.com/shop/explore-artists): [`landing.module.css`](../../app/(store)/shop/home-v2/landing.module.css) page shell + [`explore-artists.module.css`](../../app/(store)/shop/explore-artists/explore-artists.module.css) section and card patterns, with small overrides in [`collector-store.module.css`](../../app/(store)/shop/street-collector/collector-store.module.css). TypeScript fixes for optional artist `location`, `collectionHref` merge typing, and FAQ props compatible with `street-collector` content `as const`.

## Implementation Checklist

- [x] [`app/(store)/shop/street-collector/collector-store.module.css`](../../app/(store)/shop/street-collector/collector-store.module.css) — Compact hero, drops grid, lamp row, testimonial
- [x] [`app/(store)/shop/street-collector/page.tsx`](../../app/(store)/shop/street-collector/page.tsx) — Landing + explore classes; featured artist typing; upcoming card footer layout
- [x] [`app/(store)/shop/street-collector/StreetCollectorFAQ.tsx`](../../app/(store)/shop/street-collector/StreetCollectorFAQ.tsx) — `ReadonlyArray` / readonly FAQ items for `as const` content
- [x] [`app/(store)/shop/street-collector/CollectorHomeArtistRoster.tsx`](../../app/(store)/shop/street-collector/CollectorHomeArtistRoster.tsx)
- [x] [`app/(store)/shop/street-collector/UpcomingDropCountdown.tsx`](../../app/(store)/shop/street-collector/UpcomingDropCountdown.tsx)
- [x] [`app/(store)/shop/drops/DropsPageClient.tsx`](../../app/(store)/shop/drops/DropsPageClient.tsx)
- [x] [`app/(store)/shop/reserve/ReservePageClient.tsx`](../../app/(store)/shop/reserve/ReservePageClient.tsx) — Reserve benefit titles use `featuredHook`; explore shell
- [x] [`docs/COMMIT_LOGS/explore-artists-design-system-collector-shop-2026-04-21.md`](./explore-artists-design-system-collector-shop-2026-04-21.md) — This log

## Verification

- `npm run build` — pass (2026-04-21; Shopify fetch timeouts during SSG did not fail the build)
- IDE TypeScript — no errors on touched files

## References

- Live reference: [Artist directory — Street Collector](https://www.thestreetcollector.com/shop/explore-artists)
- [`docs/features/street-collector/ARTIST_LED_REDESIGN.md`](../features/street-collector/ARTIST_LED_REDESIGN.md)
