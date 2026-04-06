# Commit log: default experience spotlight no longer prefers saturn_png (2026-04-06)

## Summary

The experience **default** artist spotlight (when the user does not pass `?artist=` / `?vendor=`) is chosen by [`app/api/shop/artist-spotlight/route.ts`](../../app/api/shop/artist-spotlight/route.ts): Jack J.C. Art collections first, then **Season 2 (2025-edition)** newest products, then **newest Shopify products**. Recently **saturn_png** was winning those automatic paths. **`DEFAULT_SPOTLIGHT_SKIP_VENDORS`** now excludes **`saturn_png`** (normalized vendor string) from Season 2 and Shopify “newest” resolution so the **next eligible artist** is featured. Deep links to saturn are unchanged.

## Checklist

- [x] [`app/api/shop/artist-spotlight/route.ts`](../../app/api/shop/artist-spotlight/route.ts) — `DEFAULT_SPOTLIGHT_SKIP_VENDORS`, `normalizeVendorForSpotlight`, `shouldSkipDefaultSpotlightVendor`; Season 2 anchor + `vendorNodes`; Shopify `getProducts` `first: 20` when scanning for first non-skipped vendor
- [x] [`docs/features/experience-v2/README.md`](../../docs/features/experience-v2/README.md) — changelog line under Version
- [x] Tests: `npx jest lib/shop/experience-featured-bundle.test.ts` — pass (17)

## Deployment

- Production: `vercel --prod --yes` after commit (per project rules).
