# Commit log: India on ship-to list + “country not listed” outreach mailto

**Date:** 2026-04-12

## Summary

Adds **India (`IN`)** to the canonical [`STORE_SHIP_TO_COUNTRIES`](../../lib/shopify/shipping-zone-country-codes.ts) list (48 countries). Introduces a prefilled **`mailto:`** outreach flow ([`lib/shop/shipping-outreach-mailto.ts`](../../lib/shop/shipping-outreach-mailto.ts), optional `NEXT_PUBLIC_ORDER_OUTREACH_EMAIL` in [`.env.example`](../../.env.example)) and [`ShippingCountryNotListedLink`](../../components/shop/checkout/ShippingCountryNotListedLink.tsx) on cart checkout ([`CheckoutLayout`](../../components/shop/checkout/CheckoutLayout.tsx)), address modal ([`AddressModal`](../../components/shop/checkout/AddressModal.tsx)), inline address form, and experience [`OrderBar`](../../app/(store)/shop/experience-v2/components/OrderBar.tsx). Cart line text is passed into the email body where available. FAQ and shipping policy copy updated for India + outreach.

## Checklist

- [x] [`lib/shopify/shipping-zone-country-codes.ts`](../../lib/shopify/shipping-zone-country-codes.ts) — India in canonical list.
- [x] [`lib/shopify/shipping-zone-country-codes.test.ts`](../../lib/shopify/shipping-zone-country-codes.test.ts) — expect 48 countries.
- [x] [`lib/shop/shipping-outreach-mailto.ts`](../../lib/shop/shipping-outreach-mailto.ts) + [`lib/shop/shipping-outreach-mailto.test.ts`](../../lib/shop/shipping-outreach-mailto.test.ts).
- [x] [`components/shop/checkout/ShippingCountryNotListedLink.tsx`](../../components/shop/checkout/ShippingCountryNotListedLink.tsx) — UI link.
- [x] [`components/shop/checkout/CheckoutLayout.tsx`](../../components/shop/checkout/CheckoutLayout.tsx) — `shippingOutreachOrderSummary`, link + modal prop.
- [x] [`app/(store)/shop/cart/page.tsx`](../../app/(store)/shop/cart/page.tsx), [`components/impact/LocalCartDrawer.tsx`](../../components/impact/LocalCartDrawer.tsx) — pass order summary.
- [x] [`app/(store)/shop/experience-v2/components/OrderBar.tsx`](../../app/(store)/shop/experience-v2/components/OrderBar.tsx) — experience drawer link.
- [x] [`content/shop-faq.ts`](../../content/shop-faq.ts), [`app/policies/shipping-policy/page.tsx`](../../app/policies/shipping-policy/page.tsx).

## Verification

- [ ] Tap “Don’t see your country?” — mail client opens with subject/body and cart lines when on cart/drawer.
- [ ] Stripe `allowed_countries` includes `IN` after deploy.
