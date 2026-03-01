# PayPal Checkout Integration

**Date:** 2026-03-01

## Summary

Integrated PayPal Smart Payment Buttons via `@paypal/react-paypal-js` for experience checkout. Enables PayPal as an express checkout option alongside Stripe card/Google Pay/Link.

## Implementation Checklist

- [x] [`app/api/checkout/paypal/create-order/route.ts`](../../app/api/checkout/paypal/create-order/route.ts) — POST creates PayPal order with items, returnUrl, cancelUrl; returns orderId
- [x] [`app/api/checkout/paypal/capture/route.ts`](../../app/api/checkout/paypal/capture/route.ts) — POST captures approved order, creates Shopify draft order via `createAndCompleteOrder`, records in `stripe_purchases`
- [x] [`components/shop/checkout/PayPalButton.tsx`](../../components/shop/checkout/PayPalButton.tsx) — PayPalButtons wrapper with createOrder/onApprove calling our APIs; stores pending data for redirect flow
- [x] [`components/shop/checkout/PaymentMethodsModal.tsx`](../../components/shop/checkout/PaymentMethodsModal.tsx) — Adds PayPal button above PaymentStep when `NEXT_PUBLIC_PAYPAL_CLIENT_ID` set; "Or pay with card" divider
- [x] [`app/shop/checkout/paypal-return/page.tsx`](../../app/shop/checkout/paypal-return/page.tsx) — Handles PayPal redirect flow: reads token, captures order, redirects to success
- [x] [`app/api/checkout/stripe/route.ts`](../../app/api/checkout/stripe/route.ts) — GET supports `paypal_order` param to fetch purchase from `stripe_purchases`
- [x] [`app/shop/checkout/success/checkout-success-content.tsx`](../../app/shop/checkout/success/checkout-success-content.tsx) — Uses `paypal_order` query param for success URL

## Environment Variables

- **`NEXT_PUBLIC_PAYPAL_CLIENT_ID`** — PayPal client ID for Smart Buttons (frontend)
- **`PAYPAL_CLIENT_ID`** — PayPal API client ID (backend)
- **`PAYPAL_CLIENT_SECRET`** — PayPal API secret (backend)
- **`PAYPAL_ENVIRONMENT`** — `production` for live, omit for sandbox

## Flow

1. User adds items and address in experience checkout
2. Opens payment modal; PayPal button appears when configured
3. **Popup flow:** Clicks PayPal → create order → approves in popup → onApprove calls capture → redirect to success
4. **Redirect flow:** Clicks PayPal → redirects to PayPal → approves → returns to `/shop/checkout/paypal-return?token=...` → page calls capture → redirect to success

## References

- [PayPal Orders v2 API](https://developer.paypal.com/docs/api/orders/v2/)
- [@paypal/react-paypal-js](https://www.npmjs.com/package/@paypal/react-paypal-js)
- [`lib/paypal/client.ts`](../../lib/paypal/client.ts) — Shared PayPal API client
