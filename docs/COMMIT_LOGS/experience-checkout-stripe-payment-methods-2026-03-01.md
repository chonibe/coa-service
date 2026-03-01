# Experience Checkout: Credit Card, Link, PayPal Stripe Integration — March 1, 2026

## Summary

Configured credit card, Stripe Link (Google Pay), and PayPal for the embedded checkout flow at `/shop/experience`. The experience uses an in-drawer checkout with embedded payment for card/Link, and redirects to Stripe Checkout for PayPal.

## Changes Made

### 1. API: confirm-payment — Support Link Payment Methods

- [x] **`app/api/checkout/confirm-payment/route.ts`** — Changed `payment_method_types: ['card']` to `['card', 'link']`
  - Previously, Link payment methods (including Google Pay via Link) failed when confirming the PaymentIntent
  - Now both card and Link payment methods work in the embedded flow

### 2. Payment Flow Architecture

| Method | Flow | API / Component |
|--------|------|-----------------|
| **Credit Card** | Embedded | SetupIntent → Payment Element → confirm-payment (PaymentIntent with card+link) |
| **Link / Google Pay** | Embedded | Same as card; SetupIntent + Payment Element collect Link; confirm-payment accepts link type |
| **PayPal** | Redirect | create API → Stripe Checkout Session (paypal only) → redirect |

### 3. Already Configured (Verified)

- **`app/api/checkout/create-setup-intent/route.ts`** — `payment_method_types: ['card', 'link']` ✓
- **`components/shop/checkout/CardInputSection.tsx`** — Payment Element with card + Link (customer email for Link prefilling) ✓
- **`app/api/checkout/create/route.ts`** — Supports `paymentMethodPreference: 'link' \| 'paypal' \| 'card'` for redirect flow ✓
- **`app/shop/experience/components/OrderBar.tsx`** — Uses embedded flow when card/link + savedCard; falls through to create when PayPal ✓

### 4. Stripe Dashboard Requirements

- Enable **Link** in [Stripe Dashboard → Payment methods](https://dashboard.stripe.com/settings/payment_methods)
- Enable **PayPal** for redirect flow
- Enable **Google Pay** if desired (surfaces with Link/card)

## Verification Checklist

- [ ] Test embedded checkout with card (4242 4242 4242 4242)
- [ ] Test embedded checkout with Link (when Link is available)
- [ ] Test PayPal: select PayPal → redirect → complete on Stripe → success
- [ ] Test 3DS when prompted (handleNextAction)
- [ ] Confirm success page loads for both embedded and redirect flows

## Related Files

- [`app/api/checkout/confirm-payment/route.ts`](/app/api/checkout/confirm-payment/route.ts)
- [`app/api/checkout/create-setup-intent/route.ts`](/app/api/checkout/create-setup-intent/route.ts)
- [`app/shop/experience/components/OrderBar.tsx`](/app/shop/experience/components/OrderBar.tsx)
- [`components/shop/checkout/CheckoutLayout.tsx`](/components/shop/checkout/CheckoutLayout.tsx)
- [`components/shop/checkout/PaymentMethodModal.tsx`](/components/shop/checkout/PaymentMethodModal.tsx)
- [`components/shop/checkout/CardInputSection.tsx`](/components/shop/checkout/CardInputSection.tsx)
- [`lib/shop/CheckoutContext.tsx`](/lib/shop/CheckoutContext.tsx)

## References

- [Stripe PaymentIntent payment_method_types](https://docs.stripe.com/api/payment_intents/create#create_payment_intent-payment_method_types)
- [Stripe Link](https://docs.stripe.com/payments/link)
- [Stripe PayPal](https://docs.stripe.com/payments/paypal)
