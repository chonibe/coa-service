# Artist-led storefront (collector-first shop)

**Date:** 2026-04-21  
**Branch:** `artist-led`  
**Type:** Feature

## Summary

Collector-first IA: shared top chrome (Drops / Artists / The Reserve / Lamp), rebuilt [`/shop/street-collector`](../../app/(store)/shop/street-collector/page.tsx), new [`/shop/drops`](../../app/(store)/shop/drops/page.tsx), artist profile and edition PDP updates with ladder badges from edition-states, demoted lamp cross-sell on artwork PDPs, single **$20/mo** Reserve tier (`STREET_RESERVE_STRIPE_PRICE_RESERVE`), and feature doc.

## Implementation Checklist

- [x] [`lib/shop/collector-store-shell.ts`](../../lib/shop/collector-store-shell.ts) — Which paths use collector shell
- [x] [`lib/shop/collector-ladder-styles.ts`](../../lib/shop/collector-ladder-styles.ts) — Ladder badge tokens
- [x] [`lib/shop/street-lamp-handle.ts`](../../lib/shop/street-lamp-handle.ts) — Lamp handle + path helper
- [x] [`components/shop/CollectorStoreTopChrome.tsx`](../../components/shop/CollectorStoreTopChrome.tsx) — Nav chrome
- [x] [`app/(store)/layout.tsx`](../../app/(store)/layout.tsx) — Theme/footer keyed to collector shell
- [x] [`app/(store)/shop/street-collector/page.tsx`](../../app/(store)/shop/street-collector/page.tsx) — Homepage + metadata
- [x] [`app/(store)/shop/street-collector/CollectorHomeArtistRoster.tsx`](../../app/(store)/shop/street-collector/CollectorHomeArtistRoster.tsx)
- [x] [`app/(store)/shop/street-collector/UpcomingDropCountdown.tsx`](../../app/(store)/shop/street-collector/UpcomingDropCountdown.tsx)
- [x] [`app/(store)/shop/drops/page.tsx`](../../app/(store)/shop/drops/page.tsx) + [`DropsPageClient.tsx`](../../app/(store)/shop/drops/DropsPageClient.tsx)
- [x] [`app/(store)/shop/artists/[slug]/ArtistProfilePageClient.tsx`](../../app/(store)/shop/artists/[slug]/ArtistProfilePageClient.tsx)
- [x] [`app/(store)/shop/[handle]/page.tsx`](../../app/(store)/shop/[handle]/page.tsx) — PDP chrome, ladder, watchlist, lamp teaser
- [x] [`lib/shop/street-reserve-config.ts`](../../lib/shop/street-reserve-config.ts) — `reserve` tier + lock days
- [x] [`app/api/shop/reserve/subscribe/route.ts`](../../app/api/shop/reserve/subscribe/route.ts) — Checkout tier `reserve` only
- [x] [`app/(store)/shop/reserve/page.tsx`](../../app/(store)/shop/reserve/page.tsx) + [`ReservePageClient.tsx`](../../app/(store)/shop/reserve/ReservePageClient.tsx)
- [x] [`lib/shop/street-edition-states.ts`](../../lib/shop/street-edition-states.ts) + [`lib/shop/query-edition-states.ts`](../../lib/shop/query-edition-states.ts) + [`app/api/shop/edition-states/route.ts`](../../app/api/shop/edition-states/route.ts)
- [x] [`.env.example`](../../.env.example) — `STREET_RESERVE_STRIPE_PRICE_RESERVE` + lamp handle
- [x] [`docs/features/street-collector/ARTIST_LED_REDESIGN.md`](../features/street-collector/ARTIST_LED_REDESIGN.md)
- [x] [`docs/COMMIT_LOGS/artist-led-storefront-2026-04-21.md`](./artist-led-storefront-2026-04-21.md) — This log

## Verification

- `npm run build` — pass (2026-04-21)

## References

- [`docs/features/street-collector/ARTIST_LED_REDESIGN.md`](../features/street-collector/ARTIST_LED_REDESIGN.md)
