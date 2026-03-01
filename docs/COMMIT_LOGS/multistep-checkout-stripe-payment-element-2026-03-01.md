# Multi-Step In-Drawer Checkout with Stripe Payment Element

**Date**: 2026-03-01
**Version**: 1.4.0

## Summary

Refactored the experience OrderBar drawer from a modal-based checkout into a multi-step in-drawer checkout using Stripe Payment Element with PaymentIntent. Supports Credit Card, Google Pay, Link, and PayPal -- all within the cart drawer.

## Changes

### New Files

- [x] [`app/api/checkout/create-payment-intent/route.ts`](../../app/api/checkout/create-payment-intent/route.ts) -- Creates PaymentIntent with `card`, `link`, `paypal`; metadata includes `collector_identifier` for success page
- [x] [`app/api/checkout/complete-order/route.ts`](../../app/api/checkout/complete-order/route.ts) -- Idempotent order fulfillment: verifies PaymentIntent, creates Shopify draft order, records in `stripe_purchases`
- [x] [`components/shop/checkout/InlineAddressForm.tsx`](../../components/shop/checkout/InlineAddressForm.tsx) -- Compact inline address form for drawer (email, name, country, address, city, postal, phone)
- [x] [`components/shop/checkout/PaymentStep.tsx`](../../components/shop/checkout/PaymentStep.tsx) -- Stripe Elements + PaymentElement (tabs: google_pay, card, link, paypal), order summary, promo code, Place Order button

### Modified Files

- [x] [`app/shop/experience/components/OrderBar.tsx`](../../app/shop/experience/components/OrderBar.tsx) -- Replaced single-step + CheckoutLayout with 3-step flow (Cart → Shipping → Payment) with step indicator and animated transitions
- [x] [`lib/shop/CheckoutContext.tsx`](../../lib/shop/CheckoutContext.tsx) -- Added `CheckoutStep` type, `step` state, `paymentIntentClientSecret`, `setStep`, `setPaymentIntentClientSecret`, `goToCart`, `goToShipping`, `goToPayment` (backward compatible)
- [x] [`components/shop/checkout/index.ts`](../../components/shop/checkout/index.ts) -- Exported `InlineAddressForm`, `PaymentStep` and their prop types
- [x] [`app/shop/checkout/success/checkout-success-content.tsx`](../../app/shop/checkout/success/checkout-success-content.tsx) -- PayPal redirect handling: reads pending items/address from sessionStorage, calls `complete-order` to fulfill
- [x] [`app/api/checkout/stripe/route.ts`](../../app/api/checkout/stripe/route.ts) -- Fallback to `collector_email` for PaymentIntent success page when `collector_identifier` missing
- [x] [`docs/features/experience/README.md`](../../docs/features/experience/README.md) -- Updated checkout documentation with multi-step flow, payment methods table, and new API endpoints

### Backward Compatibility

- [x] Existing modal-based checkout (AddressModal, PaymentMethodModal, PromoCodeModal) preserved for main shop cart
- [x] `/api/checkout/create` still used by main cart page
- [x] `/api/checkout/confirm-payment` and `/api/checkout/create-setup-intent` kept for legacy compatibility
- [x] `useCheckout()` API fully backward compatible (new fields added, none removed)

## Architecture

### Checkout Steps

1. **Cart Review** -- Lamp row, artwork rows, gift note, totals, "Continue to Shipping"
2. **Shipping Address** -- Inline form with validation, "Continue to Payment"
3. **Payment + Confirm** -- Stripe PaymentElement (card/GPay/Link/PayPal), promo code, order summary, "Pay $XX.XX"

### Payment Flow

- Card/GPay/Link: `confirmPayment({ redirect: 'if_required' })` → inline success → `POST /api/checkout/complete-order` → redirect to success page
- PayPal: `confirmPayment` → redirect to PayPal → return to success page → success page calls `complete-order` with sessionStorage data

### Stripe Configuration

- Domain `app.thestreetcollector.com` registered for Google Pay
- Payment methods enabled: card, link, paypal
- Google Pay works through the `card` payment method type with wallet support
