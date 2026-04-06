# Commit log: saturn_png Shopify collection pairing (2026-04-06)

## Summary

Paired vendor **saturn_png** to Shopify collection ID **686811218306** (admin URL path `/collections/686811218306`) so `vendor_collections` supplies `shopify_collection_id` and handle **`saturn-png`**. Downstream code (`fetchArtistProfile`, `getArtistImageByHandle`, affiliate `resolveRefToVendorId`) can load collection **description**, image, and products via Storefront `getCollectionById`.

## Checklist

- [x] [supabase/migrations/20260406120000_vendor_collection_saturn_png.sql](../supabase/migrations/20260406120000_vendor_collection_saturn_png.sql) — `INSERT … ON CONFLICT (vendor_id) DO UPDATE` keyed on `vendors.vendor_name = 'saturn_png'`
- [x] [docs/features/street-collector/explore-artists/README.md](../features/street-collector/explore-artists/README.md) — change log 1.1.6

## Apply on database

Run the migration against your Supabase project (Dashboard SQL editor, or `supabase db push` after local migration history matches remote). If `supabase db push` reports drift, repair migration history per CLI output or apply the SQL file manually once.

## Verification

- Open `/shop/artists/saturn-png` (or slug used in app) and confirm bio/description and product grid match the Shopify collection.
- Optional: `GET /api/shop/artists/saturn-png` returns `profile` / products populated from the collection.
