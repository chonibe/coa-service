# Admin: pair Shopify collection URL for experience artist bio

## Date: 2026-04-06

## Summary

Admins can paste a Shopify Admin collection URL (or storefront `/collections/handle`, or numeric id) on **Artist Experience Links** to preview and save the mapping in `vendor_collections`. Public `GET /api/shop/artists` now prefers `vendor_collections.shopify_collection_handle` as `slug` so experience and short links use the same handle the storefront uses.

## Checklist

- [x] [lib/shopify/parse-shopify-collection-url.ts](../../lib/shopify/parse-shopify-collection-url.ts) — Parse Admin URLs, raw ids, storefront handles
- [x] [lib/shopify/parse-shopify-collection-url.test.ts](../../lib/shopify/parse-shopify-collection-url.test.ts) — Jest coverage for parser (`npx jest lib/shopify/parse-shopify-collection-url.test.ts`)
- [x] [lib/shopify/fetch-collection-rest-by-id.ts](../../lib/shopify/fetch-collection-rest-by-id.ts) — Admin REST fetch by id or handle
- [x] [lib/shopify/resolve-pasted-collection.ts](../../lib/shopify/resolve-pasted-collection.ts) — Resolver entry point
- [x] [app/api/admin/vendor-collections/link-collection/route.ts](../../app/api/admin/vendor-collections/link-collection/route.ts) — `POST` with `previewOnly` and save
- [x] [app/admin/vendors/experience-links/page.tsx](../../app/admin/vendors/experience-links/page.tsx) — Preview / Save link UI per artist
- [x] [lib/shop/artists-list.ts](../../lib/shop/artists-list.ts) — `slug` from paired collection handle when present
- [x] [docs/features/experience-v2/README.md](../../docs/features/experience-v2/README.md) — Admin pairing documentation

## Deployment

After merge: `vercel --prod --yes` (per project rules).

---

## Follow-up: 2026-04-06 — vendor not found (e.g. Saturn Png)

- [x] [lib/shop/admin-resolve-vendor-for-collection-link.ts](../../lib/shop/admin-resolve-vendor-for-collection-link.ts) — Resolve by name, `vendor_collections` handle, slugified `vendor_name`; optional auto-create `vendors` row
- [x] [app/api/admin/vendor-collections/link-collection/route.ts](../../app/api/admin/vendor-collections/link-collection/route.ts) — `artistSlug`, `createVendorIfMissing` (default true)
- [x] [app/admin/vendors/experience-links/page.tsx](../../app/admin/vendors/experience-links/page.tsx) — Sends `artistSlug` with each link request
