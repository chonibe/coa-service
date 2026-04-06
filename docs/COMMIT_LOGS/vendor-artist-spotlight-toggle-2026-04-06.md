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

1. **If `supabase db push --include-all` fails** on older migrations (e.g. duplicate policy on `experience_quiz_signups`), apply **only** this migration with a direct Postgres URL from `.env.local`:
   ```bash
   node scripts/apply-migration-from-env.mjs supabase/migrations/20260406121000_vendor_artist_spotlight_enabled.sql
   npx supabase migration repair 20260406121000 --status applied --linked
   ```
2. Or paste the SQL from [`supabase/migrations/20260406121000_vendor_artist_spotlight_enabled.sql`](../../supabase/migrations/20260406121000_vendor_artist_spotlight_enabled.sql) into the Supabase SQL editor and run it.

## Verification

1. Admin → **Vendors** → edit a vendor → toggle **Shop spotlight** off → Save.
2. Load `/api/shop/artist-spotlight` (no query): response should not feature that vendor when they would have been the automatic pick.
3. Load `/api/shop/artist-spotlight?artist=<their-handle>`: spotlight should still return that artist.
