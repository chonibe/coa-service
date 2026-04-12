# Commit log: Stripe `allowed_countries` = canonical + Shopify zones

**Date:** 2026-04-12

## Summary

**Stripe** `shipping_address_collection.allowed_countries` is now the **union** of the canonical [`STORE_SHIP_TO_COUNTRIES`](../../lib/shopify/shipping-zone-country-codes.ts) list and **all ISO codes** returned from Shopify Admin shipping zones (`mergeShippingCountryCodesForStripe`). Storefront/API display list (`resolveShipToCountriesForDisplay`) includes **canonical rows plus any Shopify-only zones**, sorted by name. On Shopify misconfiguration or unreachable zones, behavior falls back to **canonical only** (same as before for those error paths). In **development**, checkout logs include the merged `allowed_countries` count for debugging short Stripe dropdowns (Stripe may still hide some codes per account or payment method).

## Checklist

- [x] [`lib/shopify/shipping-zone-country-codes.ts`](../../lib/shopify/shipping-zone-country-codes.ts) — `resolveShipToCountriesForDisplay`, `mergeShippingCountryCodesForStripe`, `getStripeCheckoutAllowedShippingCountryCodes`.
- [x] [`lib/shopify/shipping-zone-country-codes.test.ts`](../../lib/shopify/shipping-zone-country-codes.test.ts) — Shopify extras in resolve; `mergeShippingCountryCodesForStripe` union.
- [x] [`lib/shop/product-carousel-slides.test.ts`](../../lib/shop/product-carousel-slides.test.ts) — remove Vitest import so Jest globals apply cleanly.
- [x] [`lib/shop/resolve-artwork-detail-product.test.ts`](../../lib/shop/resolve-artwork-detail-product.test.ts) — same.

## Verification

- [ ] Create a Stripe Checkout session locally; confirm dev log `allowed_countries count=…` matches expectation when Shopify zones load.
- [ ] If the hosted Checkout country list is still shorter than the API list, check Stripe Dashboard restrictions and payment method (e.g. wallet) behavior.
