# Commit log: Canonical 47-country ship-to list for Stripe and checkout UI

**Date:** 2026-04-12

## Summary

Defines **`STORE_SHIP_TO_COUNTRIES`** (47 ISO codes) to match shipping policy / FAQ (North America through Oceania, including Mexico, Ukraine, Russia, Taiwan, Vietnam, etc.). **Stripe** `allowed_countries` is **exactly** this set (no longer “whatever Shopify returns alone”). **`/api/shopify/shipping-countries`** returns the same 47 rows, with **labels from Shopify Admin zones** when a code exists in both. If Shopify zones are unreachable, the API returns **200** with the canonical list and a **`warning`** field. **`lib/data/countries.ts`** `COUNTRY_OPTIONS` is sourced from the same canonical list; phone dial metadata extended for new regions.

## Checklist

- [x] [`lib/shopify/shipping-zone-country-codes.ts`](../../lib/shopify/shipping-zone-country-codes.ts) — `STORE_SHIP_TO_COUNTRIES`, `resolveShipToCountriesForDisplay`, `getStripeCheckoutAllowedShippingCountryCodes`, `STRIPE_CHECKOUT_SHIPPING_COUNTRY_CODES_FALLBACK`.
- [x] [`lib/shopify/shipping-zone-country-codes.test.ts`](../../lib/shopify/shipping-zone-country-codes.test.ts) — count 47, resolve/label behavior, Shopify-only codes dropped.
- [x] [`app/api/shopify/shipping-countries/route.ts`](../../app/api/shopify/shipping-countries/route.ts) — resolved list; degraded 200 on zone fetch failure.
- [x] [`lib/data/countries.ts`](../../lib/data/countries.ts) — `COUNTRY_OPTIONS` from store list; dial codes for UA, RU, TW, TH, MY, VN, etc.
- [x] [`app/api/checkout/create/route.ts`](../../app/api/checkout/create/route.ts) and [`app/api/checkout/stripe/route.ts`](../../app/api/checkout/stripe/route.ts) — `getStripeCheckoutAllowedShippingCountryCodes` for `allowed_countries`.

## Verification

- [ ] Stripe Checkout session creation succeeds with `allowed_countries` length 47 (watch for provider restrictions on any code, e.g. sanctions).
- [ ] `/api/shopify/shipping-countries` returns 47 countries; address dropdowns match.
