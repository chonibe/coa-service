# PayPal Order Details & Draft Order Fix — 2026-03-19

## Summary

Fixes two issues reported from a live PayPal order:
1. **Missing order details**: Customer email and address were not captured in the order (Shopify or Stripe) despite being entered in the session
2. **Draft order instead of full order**: A draft order was created in Shopify when it should have been a completed order

## Root Causes

### Issue 1: Missing Order Details
- **Session creation timing**: Checkout session could be created before the user entered their address (when drawer opened or payment section expanded)
- **Metadata truncation**: `shipping_address` JSON in Stripe metadata could be truncated at 500 chars, producing invalid JSON
- **PayPal return flow**: For Checkout Sessions, Stripe returns with `session_id` (not `payment_intent`). The success page only called `complete-order` when `payment_intent` was present, so sessionStorage data was never used for order creation
- **Webhook fallback**: When `customer_details` was empty (common with PayPal), billing address and customer name were not populated from metadata

### Issue 2: Draft Order
- Draft orders without a valid shipping address may fail to complete in Shopify
- The webhook creates a draft and calls `complete`; if required fields are missing, the conversion to a full order can fail

## Changes

### 1. [`app/api/checkout/create-checkout-session/route.ts`](../../app/api/checkout/create-checkout-session/route.ts)
- Truncate individual address fields before JSON stringify to stay under Stripe's 500-char metadata limit
- Ensures valid JSON is always stored

### 2. [`components/shop/checkout/PaymentStep.tsx`](../../components/shop/checkout/PaymentStep.tsx)
- Only fetch/create checkout session when `customerEmail` or `shippingAddress.email` is present
- Reset fetch when address becomes available (prevents session without address)
- Show "Add your email and address above to continue" when address is missing

### 3. [`app/(store)/shop/experience-v2/components/OrderBar.tsx`](../../app/(store)/shop/experience-v2/components/OrderBar.tsx)
- Don't preload checkout session until `checkout.address?.email` is set
- Ensures preloaded session always includes customer details

### 4. [`app/api/stripe/webhook/route.ts`](../../app/api/stripe/webhook/route.ts)
- Add idempotency: skip order creation if `stripe_purchases` already exists for this payment_intent (avoids duplicate when success page calls `complete-order` first)
- Enrich `customer` from metadata when `customer_details` is empty (PayPal): email, phone, name from `shipping_address` metadata
- Use shipping address as billing fallback when `customer_details.address` is empty
- Ensures draft order has required fields for successful completion

### 5. [`app/(store)/shop/checkout/success/checkout-success-content.tsx`](../../app/(store)/shop/checkout/success/checkout-success-content.tsx)
- When returning with `session_id` (PayPal via Checkout Session) and sessionStorage has items/address, fetch session to get `paymentIntentId` and call `complete-order`
- Ensures order is created with correct customer details even when webhook runs with stale metadata

### 6. [`app/api/checkout/stripe/route.ts`](../../app/api/checkout/stripe/route.ts)
- Add `paymentIntentId` to session response so success page can call `complete-order` when needed

## Verification Checklist

- [ ] PayPal checkout with address entered before payment → order has email and address in Shopify and Stripe
- [ ] PayPal checkout → Shopify order is a full order (not draft)
- [ ] Card/GPay/Link checkout still works
- [ ] Success page displays correctly for both `session_id` and `payment_intent` returns

## Related

- [address-form-enhancements-2026-03-02.md](./address-form-enhancements-2026-03-02.md) — sessionStorage persistence for PayPal
- [multistep-checkout-stripe-payment-element-2026-03-01.md](./multistep-checkout-stripe-payment-element-2026-03-01.md) — complete-order flow
