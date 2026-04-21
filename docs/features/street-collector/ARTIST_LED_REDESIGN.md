# Artist-led storefront redesign

## Purpose

Shift the public shop from lamp-first to **collector-first**: drops, artists, and The Reserve lead; the lamp is infrastructure. This document links implementation files and operational notes.

## Implementation (primary files)

| Area | File |
|------|------|
| Collector shell routes (light/dark + fab) | [`app/(store)/layout.tsx`](../../../app/(store)/layout.tsx) |
| Shell path helper | [`lib/shop/collector-store-shell.ts`](../../../lib/shop/collector-store-shell.ts) |
| Fixed chrome offset (padding / spacer) | [`lib/shop/collector-store-chrome-layout.ts`](../../../lib/shop/collector-store-chrome-layout.ts) |
| Top nav (Drops / Artists / Reserve / Lamp) | [`components/shop/CollectorStoreTopChrome.tsx`](../../../components/shop/CollectorStoreTopChrome.tsx) |
| Homepage | [`app/(store)/shop/street-collector/page.tsx`](../../../app/(store)/shop/street-collector/page.tsx) |
| Artist roster strip (client) | [`app/(store)/shop/street-collector/CollectorHomeArtistRoster.tsx`](../../../app/(store)/shop/street-collector/CollectorHomeArtistRoster.tsx) |
| Upcoming countdown (client) | [`app/(store)/shop/street-collector/UpcomingDropCountdown.tsx`](../../../app/(store)/shop/street-collector/UpcomingDropCountdown.tsx) |
| All drops | [`app/(store)/shop/drops/page.tsx`](../../../app/(store)/shop/drops/page.tsx), [`DropsPageClient.tsx`](../../../app/(store)/shop/drops/DropsPageClient.tsx) |
| Artist profile | [`app/(store)/shop/artists/[slug]/ArtistProfilePageClient.tsx`](../../../app/(store)/shop/artists/[slug]/ArtistProfilePageClient.tsx) |
| Edition PDP | [`app/(store)/shop/[handle]/page.tsx`](../../../app/(store)/shop/[handle]/page.tsx) |
| The Reserve (server metadata + client UI) | [`app/(store)/shop/reserve/page.tsx`](../../../app/(store)/shop/reserve/page.tsx), [`ReservePageClient.tsx`](../../../app/(store)/shop/reserve/ReservePageClient.tsx) |
| Reserve config + checkout tier | [`lib/shop/street-reserve-config.ts`](../../../lib/shop/street-reserve-config.ts) |
| Reserve subscribe API | [`app/api/shop/reserve/subscribe/route.ts`](../../../app/api/shop/reserve/subscribe/route.ts) |
| Edition ladder query (shared) | [`lib/shop/query-edition-states.ts`](../../../lib/shop/query-edition-states.ts) |
| Ladder badge colors | [`lib/shop/collector-ladder-styles.ts`](../../../lib/shop/collector-ladder-styles.ts) |
| Lamp PDP handle | [`lib/shop/street-lamp-handle.ts`](../../../lib/shop/street-lamp-handle.ts) |

## Stripe / environment

- **New:** `STREET_RESERVE_STRIPE_PRICE_RESERVE` — recurring price for the single **$20/mo** Reserve product.
- **Legacy:** `STREET_RESERVE_STRIPE_PRICE_COLLECTOR`, `STREET_RESERVE_STRIPE_PRICE_CURATOR`, `STREET_RESERVE_STRIPE_PRICE_PATRON` remain documented for existing subscriptions; new checkouts send tier `reserve` in subscription metadata.
- **Lamp handle:** optional `NEXT_PUBLIC_STREET_LAMP_PRODUCT_HANDLE` (defaults to `street_lamp`).

See [`.env.example`](../../../.env.example).

## Prototype behaviors (no new artist-follow API)

- **Follow / Notify me:** CTAs route to **sign-in** (`/shop/account`), **The Reserve**, or in-app flows; no dedicated `artist_follows` table in this branch.
- **“Following” on the homepage roster** is a **demo state** when signed in (second card) to illustrate the intended UX.

## Testing

- `npm run build`
- Manual: `/shop/street-collector`, `/shop/drops`, `/shop/artists`, `/shop/artists/[slug]`, `/shop/[artwork-handle]`, `/shop/reserve` with Stripe **test** price id for `STREET_RESERVE_STRIPE_PRICE_RESERVE`.

## Version

- **Last updated:** 2026-04-21  
- **Doc version:** 1.0.1 — design polish: shared chrome offset, default trust strip on all collector pages, lamp teaser image, typography (`text-balance` / `text-pretty` / `tabular-nums`), focus rings, slideout theme sync.
