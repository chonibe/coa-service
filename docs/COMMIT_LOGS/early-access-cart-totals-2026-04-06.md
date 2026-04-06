# Early access discount in cart totals

**Date:** 2026-04-06

## Summary

Early access (10% off via `early_access_coupon` cookie) was applied in Stripe at checkout but not reflected in the cart drawer or cart page summary. `CheckoutLayout` now reads the cookie, estimates the discount on the card-charge base (subtotal minus credits), hides it when a manual promo code is entered (matching API precedence), and includes it in the displayed total and discount label.

## Checklist

- [x] [`lib/early-access-constants.ts`](../../lib/early-access-constants.ts) — Shared cookie names, max age, discount percent, cart refresh event name (client + server safe).
- [x] [`lib/early-access.ts`](../../lib/early-access.ts) — Imports/re-exports constants from `early-access-constants`.
- [x] [`lib/shop/early-access-cart.ts`](../../lib/shop/early-access-cart.ts) — `readEarlyAccessCouponPresent`, `computeEarlyAccessCartDiscount`, `dispatchEarlyAccessCartRefresh`.
- [x] [`lib/shop/early-access-cart.test.ts`](../../lib/shop/early-access-cart.test.ts) — Jest tests for discount math.
- [x] [`components/shop/checkout/CheckoutLayout.tsx`](../../components/shop/checkout/CheckoutLayout.tsx) — Cookie sync on mount, focus, and refresh event; composite discount label (Credits, Early access, Promo); `finalTotal` includes early access.
- [x] [`app/(store)/shop/artists/[slug]/ArtistPageClient.tsx`](../../app/(store)/shop/artists/[slug]/ArtistPageClient.tsx) — Dispatch refresh after successful early-access API.
- [x] [`app/(store)/shop/experience/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) — Same after successful fetch.
- [x] [`app/(store)/shop/experience-v2/components/ExperienceClient.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceClient.tsx) — Same after successful fetch.

## Notes

- Returning visitors with an existing cookie see the discount on first paint after `readEarlyAccessCouponPresent()` runs in `useEffect`.
- SPA flows dispatch `street-collector:early-access-cart-refresh` when the coupon API completes so the drawer updates without a full reload.
