# Stripe Checkout Flow Improvements

**Date:** 2026-03-02  
**Summary:** Improved experience checkout flow using Stripe MCP guidance and best practices.

## Checklist of Changes

- [x] **`app/api/checkout/create-checkout-session/route.ts`** — Enable Stripe best-practice options:
  - `allow_promotion_codes: true` — Native Stripe promo codes in Payment Element
  - `billing_address_collection: 'auto'` — Collect billing when needed (e.g. tax, compliance)
  - `payment_intent_data: { setup_future_usage: 'off_session' }` — Save cards for Link and returning customers
- [x] **`components/shop/checkout/PaymentStep.tsx`** — Error recovery and session expiry:
  - Clearer payment failure messaging ("Try a different payment method or card")
  - "Try again" button when initial session fetch fails
  - `onSessionExpired` callback to refetch when checkout session expires during payment
  - `resetAndRetry` to create a fresh Checkout Session
- [x] **`docs/features/experience/README.md`** — Updated checkout documentation to reflect Checkout Sessions API, current components, and Stripe features

## Technical Details

### Create Checkout Session

- Aligns with [Stripe Checkout Sessions quickstart](https://docs.stripe.com/payments/quickstart-checkout-sessions)
- `allow_promotion_codes` lets customers enter Stripe coupons in the Payment Element
- `setup_future_usage: 'off_session'` enables Link autofill and card saving for future purchases

### PaymentStep Error Handling

- Initial fetch: "Try again" resets state and refetches
- Session expired during confirm: Automatically triggers `resetAndRetry` to get a new session
- Payment declined: Clear guidance to try a different method or card

## References

- [Stripe MCP](https://docs.stripe.com/mcp)
- [Stripe Checkout Sessions API](https://docs.stripe.com/api/checkout/sessions/create)
- [Checkout Sessions Quickstart](https://docs.stripe.com/payments/quickstart-checkout-sessions)
