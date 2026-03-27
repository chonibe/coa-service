# Shopify experience: single Storefront request + timeout retry delay

**Date**: 2026-03-27

## Summary

Experience pages were firing **two concurrent** Storefront GraphQL requests (`getProduct('street_lamp')` and `getSeasonCollections`). On cold starts or slow Shopify responses, **both** could hit the 35s client abort, producing duplicate timeout warnings and failed `unstable_cache` revalidation. This change batches lamp + both season collections into **one** request and adds a short delay before the timeout retry.

## Checklist of Changes

- [x] **[lib/shopify/storefront-client.ts](../../lib/shopify/storefront-client.ts)** — Add `getExperienceLampAndSeasonCollections()` (one query: lamp + two collections with `ProductListFields`); export `ExperienceLampAndSeasons` type
- [x] **[lib/shopify/storefront-client.ts](../../lib/shopify/storefront-client.ts)** — `getSeasonCollections`: use GraphQL variables `$h1` / `$h2` instead of interpolating handles into the document
- [x] **[lib/shopify/storefront-client.ts](../../lib/shopify/storefront-client.ts)** — After first Storefront timeout, await configurable `SHOPIFY_STOREFRONT_RETRY_DELAY_MS` (default 750ms, `0` disables) before the single retry
- [x] **[app/(store)/shop/experience-v2/page.tsx](../../app/(store)/shop/experience-v2/page.tsx)** — Replace parallel `getCachedLamp` + `getCachedSeasonCollections` with one `unstable_cache` calling the batched fetch (`experience-shopify-bundle-v1` key)
- [x] **[app/(store)/shop/experience/page.tsx](../../app/(store)/shop/experience/page.tsx)** — Same as experience-v2

## Operational notes

- If timeouts persist, raise **`SHOPIFY_STOREFRONT_TIMEOUT_MS`** in Vercel (e.g. 50000–60000) on plans whose function max duration allows it.
- **`SHOPIFY_STOREFRONT_RETRY_DELAY_MS`**: optional; set `0` if you need immediate retry.

## Testing

- `npx tsc --noEmit` (project has pre-existing errors elsewhere; no new errors in touched files)
- Lint: clean on modified files
