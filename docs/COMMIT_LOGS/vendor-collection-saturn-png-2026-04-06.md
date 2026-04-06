# Commit log: saturn_png Shopify collection pairing (2026-04-06)

## Summary

Paired vendor **saturn_png** to Shopify collection ID **686811218306** (admin URL path `/collections/686811218306`) so `vendor_collections` supplies `shopify_collection_id` and handle **`saturn-png`**. Downstream code (`fetchArtistProfile`, `getArtistImageByHandle`, affiliate `resolveRefToVendorId`) can load collection **description**, image, and products via Storefront `getCollectionById`.

## Checklist

- [x] [supabase/migrations/20260406120000_vendor_collection_saturn_png.sql](../supabase/migrations/20260406120000_vendor_collection_saturn_png.sql) — `INSERT … ON CONFLICT (vendor_id) DO UPDATE` keyed on `vendors.vendor_name = 'saturn_png'`
- [x] [docs/features/street-collector/explore-artists/README.md](../features/street-collector/explore-artists/README.md) — change log 1.1.6
- [x] [scripts/apply-saturn-vendor-collection.mjs](../../scripts/apply-saturn-vendor-collection.mjs) — optional direct Postgres apply + `migration repair` note

## Apply on database

### Preferred: Supabase CLI (`db push`)

From the repo root, on a machine that can reach your Supabase project (linked via `supabase link`):

1. **If** `npx supabase db push` says *Remote migration versions not found in local migrations directory*:
   ```bash
   npx supabase migration fetch --linked
   ```
   (Answer **Y** if prompted to sync files.)

2. **Push** pending local migrations (including out-of-order ones):
   ```bash
   npx supabase db push --yes --include-all
   ```

3. **If** a migration fails with *already exists* (table/policy/column) because the remote DB already matches that file, mark that version applied **without** re-running SQL, then push again:
   ```bash
   npx supabase migration repair <VERSION> --status applied --linked
   npx supabase db push --yes --include-all
   ```
   Example already used in this work: `20260226100000` (`collector_ratings` duplicate policy).

4. Confirm `20260406120000` appears on both sides:
   ```bash
   npx supabase migration list
   ```

### If `db push` hangs or the pooler times out

- Run the SQL in the [Supabase Dashboard](https://supabase.com/dashboard) → SQL editor (paste [the migration file](../supabase/migrations/20260406120000_vendor_collection_saturn_png.sql)), **or**
- From the repo, with `.env.local` containing a direct Postgres URL (`DATABASE_URL` or `POSTGRES_URL_NON_POOLING`):
  ```bash
  node scripts/apply-saturn-vendor-collection.mjs
  ```
  Then sync CLI history so future `db push` does not try to re-apply the same file:
  ```bash
  npx supabase migration repair 20260406120000 --status applied --linked
  ```

## Verification

- Open `/shop/artists/saturn-png` (or slug used in app) and confirm bio/description and product grid match the Shopify collection.
- Optional: `GET /api/shop/artists/saturn-png` returns `profile` / products populated from the collection.
