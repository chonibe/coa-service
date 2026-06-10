# Collector ladder: merge Supabase with Storefront inventory

**Date:** 2026-04-21  
**Branch:** `artist-led`  
**Type:** Bugfix

## Summary

Drop cards and the Street Collector home spotlight were defaulting to **ground floor** whenever Supabase had no row, a TEXT `product_id` mismatch on `.in()`, or `edition_counter` behind Shopify. Server pages now merge DB state with the same Storefront-derived sold count used elsewhere ([`streetEditionRowFromStorefrontProduct`](../../lib/shop/street-edition-from-storefront.ts)).

## Implementation Checklist

- [x] [`lib/shop/street-edition-from-storefront.ts`](../../lib/shop/street-edition-from-storefront.ts) — `getEditionsProgressFromStorefront()`; refactor row builder to use it
- [x] [`lib/shop/merge-collector-edition-state.ts`](../../lib/shop/merge-collector-edition-state.ts) — `mergeEditionStateWithStorefront()`
- [x] [`lib/shop/query-edition-states.ts`](../../lib/shop/query-edition-states.ts) — `.in('product_id', string[])`
- [x] [`app/(store)/shop/drops/page.tsx`](../../app/(store)/shop/drops/page.tsx)
- [x] [`app/(store)/shop/street-collector/page.tsx`](../../app/(store)/shop/street-collector/page.tsx)
- [x] [`docs/COMMIT_LOGS/collector-ladder-storefront-merge-2026-04-21.md`](./collector-ladder-storefront-merge-2026-04-21.md) — This log

## Verification

- `npm run build` — pass (2026-04-21)
