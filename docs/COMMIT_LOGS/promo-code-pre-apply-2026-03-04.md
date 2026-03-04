# Promo Code Pre-Apply Fix

**Date:** 2026-03-04

## Summary

Promo codes selected in the PromoCodeModal are now actually applied at checkout. Previously, the UI showed the selected code but Stripe did not receive it—customers had to re-enter it in Stripe's field. Now the selected promo is looked up in Stripe and pre-applied via the `discounts` parameter when creating the Checkout Session.

## Changes

### API – create-checkout-session
- [x] [`app/api/checkout/create-checkout-session/route.ts`](../../app/api/checkout/create-checkout-session/route.ts)
  - Added `promoCode` to request body
  - Look up Stripe promotion code by code string (`promotionCodes.list`)
  - Pre-apply via `discounts: [{ promotion_code: promo.id }]` when valid
  - Invalid/expired codes are silently ignored (no error); user can still enter in Payment Element

### API – create (cart page / redirect checkout)
- [x] [`app/api/checkout/create/route.ts`](../../app/api/checkout/create/route.ts)
  - Same logic: look up promotion code, add `discounts` to session params
  - Cart page and LocalCartDrawer already pass `promoCode` from CheckoutContext

### OrderBar (experience checkout)
- [x] [`app/shop/experience/components/OrderBar.tsx`](../../app/shop/experience/components/OrderBar.tsx)
  - Pass `promoCode` when calling create-checkout-session (from `promoApplied` / ExperienceOrderContext)
  - Preload session re-runs when promo changes so new session includes discount

## Flow

1. User selects promo (e.g. WELCOME10) in PromoCodeModal (menu or cart drawer).
2. State is stored in ExperienceOrderContext (experience) or CheckoutContext (cart page).
3. When checkout session is created, API looks up `promotionCodes.list({ code: 'WELCOME10' })`.
4. If valid, adds `discounts: [{ promotion_code: promo_xxx }]` to session.
5. Stripe Payment Element / Checkout shows the discount applied immediately.

## Prerequisites

- Promotion codes must exist in Stripe Dashboard (or be created via API).
- Codes must be active and coupon must be valid.
- `allow_promotion_codes: true` remains so users can still change codes in Stripe's UI if needed.
