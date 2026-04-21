# Commit log: artwork Street price report script (2026-04-21)

**Commit:** `ea1426bac` — Add Supabase script to report artwork Street ladder and variant USD

## Summary

Adds a local CLI report for vendor submissions: artist, title, edition-derived **Street list USD** (when `products` rows exist), and Shopify **variant USD** from `product_data`.

## Checklist

- [x] [`scripts/report-artwork-street-prices.ts`](../../scripts/report-artwork-street-prices.ts) — New `tsx` script using `@/lib/shop/street-collector-pricing-stages` and Supabase service role from `.env.local`.
- [x] [`package.json`](../../package.json) — `npm run report:artwork-prices` → `tsx scripts/report-artwork-street-prices.ts`.

## Flags

- `--status=published|approved|all` (default `published`).
- `--json` — JSON output with `generatedAt`, `count`, `items`.
- `--include-drafts` — Include rows **without** a resolvable Shopify product id (variant USD from draft `product_data` only; ladder N/A).

## Notes

- Production catalog with synced Shopify ids + `products` edition fields yields **Street USD**; pending drafts in dev often only have **Variant USD** and a “No numeric Shopify product id” note.
