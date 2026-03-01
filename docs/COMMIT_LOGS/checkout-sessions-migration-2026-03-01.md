# Checkout Sessions API Migration

**Date:** 2026-03-01  
**Summary:** Migrated experience checkout from Payment Intents to Stripe Checkout Sessions API (`ui_mode: "custom"`) with embedded Payment Element.

## Checklist of Changes

- [x] Created [`app/api/checkout/create-checkout-session/route.ts`](../../app/api/checkout/create-checkout-session/route.ts) — POST endpoint that creates a Checkout Session with `ui_mode: "custom"`, returns `clientSecret` for CheckoutProvider
- [x] Refactored [`components/shop/checkout/PaymentStep.tsx`](../../components/shop/checkout/PaymentStep.tsx) — Switched from `Elements` + Payment Intents to `CheckoutProvider` + `useCheckout` from `@stripe/react-stripe-js/checkout`
- [x] Updated [`app/api/stripe/webhook/route.ts`](../../app/api/stripe/webhook/route.ts) — Extended `handleCheckoutCompleted` to support `source: 'experience_checkout'` and metadata-based shipping when `session.shipping_details` is null
- [x] Updated [`app/api/checkout/stripe/route.ts`](../../app/api/checkout/stripe/route.ts) — `extractProductHandles` now supports `items_json` metadata for experience_checkout series progress

## Technical Details

### Create Checkout Session API

- Creates session with `ui_mode: "custom"`, `mode: "payment"`
- Accepts `items`, `customerEmail`, `shippingAddress`
- Stores `source: 'experience_checkout'`, `shopify_variant_ids`, `shipping_address` (JSON), `items_json` in metadata
- Returns `clientSecret` for frontend CheckoutProvider

### PaymentStep Refactor

- Fetches `clientSecret` from `/api/checkout/create-checkout-session` instead of `create-payment-intent`
- Uses `CheckoutProvider` with `options: { clientSecret, elementsOptions: { appearance } }`
- Uses `useCheckout()` and `checkout.confirm()` instead of `stripe.confirmPayment()`
- On success, Stripe redirects to `return_url?session_id={CHECKOUT_SESSION_ID}`; webhook fulfills order
- Removed client-side `complete-order` call; fulfillment handled by webhook `checkout.session.completed`

### Webhook Updates

- `handleCheckoutCompleted` now accepts `source === 'experience_checkout'` in addition to `headless_storefront`
- For experience_checkout, uses `metadata.shipping_address` (JSON) when `session.shipping_details` is null
- Fallback customer object built from `metadata.collector_email` when `customer_details` is null

### Success Flow

- User completes payment → Stripe redirects to `/shop/checkout/success?session_id=xxx`
- Success page fetches `/api/checkout/stripe?session_id=xxx` for display
- Webhook `checkout.session.completed` creates Shopify draft order, completes it, records in `stripe_purchases`, runs post-purchase bridge

## References

- [Stripe Checkout Sessions Quickstart](https://docs.stripe.com/payments/quickstart-checkout-sessions)
- [`docs/features/experience/README.md`](../features/experience/README.md)
