# Commit log: Hide express shipping on Stripe Checkout

**Date:** 2026-04-12

## Summary

Stripe Checkout **`shipping_options`** now returns **only the standard rate** from [`buildStripeCheckoutShippingOptions`](../../lib/shop/stripe-checkout-shipping.ts) (free or tiered $10 / free over $70). The **$15 express** tier was removed from the session payload. Related storefront copy and admin flag descriptions were updated so customers and operators are not directed to a non-existent checkout option.

## Checklist

- [x] [`lib/shop/stripe-checkout-shipping.ts`](../../lib/shop/stripe-checkout-shipping.ts) — single standard option.
- [x] [`lib/shop/stripe-checkout-shipping.test.ts`](../../lib/shop/stripe-checkout-shipping.test.ts) — expectations length 1.
- [x] [`app/(store)/shop/[handle]/components/ProductAccordion.tsx`](../../app/(store)/shop/[handle]/components/ProductAccordion.tsx) — shipping accordion copy.
- [x] [`lib/shop/shop-discount-flags.ts`](../../lib/shop/shop-discount-flags.ts) — `shippingFreeOver70` registry description.
- [x] [`app/(store)/shop/osmo-demo/page.tsx`](../../app/(store)/shop/osmo-demo/page.tsx) — demo FAQ answer.
- [x] [`docs/features/admin-portal/README.md`](../../docs/features/admin-portal/README.md) — shop discounts bullet.

## Verification

- [ ] Create a Stripe Checkout session and confirm only one shipping choice appears.
