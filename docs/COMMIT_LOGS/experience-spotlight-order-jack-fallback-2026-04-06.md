# Commit log: default artist spotlight — Season 2 before Jack (2026-04-06)

## Summary

Jack J.C. Art was always the **first** default in [`app/api/shop/artist-spotlight/route.ts`](../../app/api/shop/artist-spotlight/route.ts), so the experience never showed the **newest Season 2** artist until Jack’s collection failed. Order is now **Season 2 (2025-edition) → Shopify newest → Supabase → Jack** (fallback only). The temporary **`saturn_png`** vendor skip list was removed so “new drop” logic is data-driven again.

## Checklist

- [x] [`app/api/shop/artist-spotlight/route.ts`](../../app/api/shop/artist-spotlight/route.ts) — reorder `GET` default branch; `shouldSkipDefaultSpotlightVendor` only skips empty vendor
- [x] [`docs/features/experience-v2/README.md`](../../docs/features/experience-v2/README.md) — Version / changelog line
- [x] [`docs/COMMIT_LOG.md`](../../docs/COMMIT_LOG.md)

## Deployment

- Production: `vercel --prod --yes` after commit (per project rules).
