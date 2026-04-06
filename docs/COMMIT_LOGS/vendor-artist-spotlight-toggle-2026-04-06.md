# Commit log: vendor artist spotlight toggle (2026-04-06)

## Summary

Adds `vendors.artist_spotlight_enabled` (default **on**) and an admin **Vendors** control to turn off default shop experience spotlight for a vendor. Automatic picks in [`app/api/shop/artist-spotlight/route.ts`](../../app/api/shop/artist-spotlight/route.ts) respect the flag; **`?artist=` / `?vendor=`** requests are unchanged.

## Checklist

- [x] [supabase/migrations/20260406121000_vendor_artist_spotlight_enabled.sql](../../supabase/migrations/20260406121000_vendor_artist_spotlight_enabled.sql) — column + comment
- [x] [lib/shop/artist-spotlight-vendor-eligibility.ts](../../lib/shop/artist-spotlight-vendor-eligibility.ts) — eligibility map + Season 2 index helper
- [x] [app/api/shop/artist-spotlight/route.ts](../../app/api/shop/artist-spotlight/route.ts) — Jack, Season 2, Shopify newest, Supabase fallback
- [x] [app/api/vendors/custom-data/route.ts](../../app/api/vendors/custom-data/route.ts) — persist flag on insert/update
- [x] [app/api/vendors/list/route.ts](../../app/api/vendors/list/route.ts) — merge flag for table + dialog
- [x] [app/admin/vendors/vendor-dialog.tsx](../../app/admin/vendors/vendor-dialog.tsx) — “Shop spotlight” checkbox
- [x] [app/admin/vendors/page.tsx](../../app/admin/vendors/page.tsx) — Spotlight On/Off column
- [x] [types/supabase.ts](../../types/supabase.ts) — generated-aligned types for `artist_spotlight_enabled`

## Apply on database

Run pending migrations on your Supabase project (e.g. `npx supabase db push --yes --include-all` after `supabase link`), or apply the SQL in the migration file in the dashboard SQL editor.

## Verification

1. Admin → **Vendors** → edit a vendor → toggle **Shop spotlight** off → Save.
2. Load `/api/shop/artist-spotlight` (no query): response should not feature that vendor when they would have been the automatic pick.
3. Load `/api/shop/artist-spotlight?artist=<their-handle>`: spotlight should still return that artist.
