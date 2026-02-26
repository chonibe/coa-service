# Checkout → Shopify Order Test Run Guide

This guide covers how to test the Stripe checkout → Shopify order creation flow.

## Prerequisites

- [ ] **Supabase**: `checkout_sessions` table exists (run `scripts/apply-checkout-sessions-table.sql` in Supabase Dashboard if needed)
- [ ] **Shopify**: Admin API credentials configured (`SHOPIFY_SHOP`, `SHOPIFY_ACCESS_TOKEN`)
- [ ] **Stripe** (for full flow): `STRIPE_SECRET_KEY` set (test mode key for local testing)

## Quick API Test (Zero-Order)

Run the automated test script (requires dev server running and `.env` / `.env.local` with Shopify + Supabase credentials):

```bash
npm run dev   # in one terminal
npm run test:checkout   # in another
```

This calls `checkout/create` → `checkout/complete` and validates Shopify order creation. If env vars are missing, the script will fail with a clear error.

---

## Option A: Zero-Order Test (No Stripe — Draft Order Only)

Tests: `checkout/create` → `checkout/complete` → Shopify Draft Order API

**Does NOT test** the Stripe webhook path.

### Steps

1. Start dev server: `npm run dev`
2. Open [http://localhost:3000/shop/experience](http://localhost:3000/shop/experience)
3. Select the lamp and at least one artwork (or just the lamp)
4. Click the **flask icon** (🧪) in the bottom-left of the preview area — "Test $0 order"
5. You'll be redirected to `/shop/checkout/zero-order?session_id=...`
6. Click **"Create order in Shopify"**
7. On success: check Shopify Admin → Orders for the new order (tagged `headless,zero-dollar-test`)

### Expected Flow

```
checkout/create (POST) → stripeChargeCents=0
  → Creates checkout_sessions record
  → Returns completeUrl: /shop/checkout/zero-order?session_id=zero_dollar_xxx

User clicks "Create order"
  → checkout/complete (POST)
  → Creates Shopify draft order
  → Completes draft (payment_pending: false)
  → Returns shopify order_id
```

---

## Option B: Full Stripe Test (Stripe → Webhook → Shopify)

Tests the complete flow: Stripe payment → webhook → Shopify draft order.

### Local Setup

1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Run webhook forwarding:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
3. Copy the webhook signing secret (e.g. `whsec_...`) and set `STRIPE_WEBHOOK_SECRET` in `.env.local`

### Steps

1. Start dev server + Stripe CLI (in separate terminals)
2. Open `/shop/experience` and add items with a **non-zero total** (e.g. 1 artwork at $X)
3. Click Checkout → redirected to Stripe Checkout
4. Use Stripe test card: `4242 4242 4242 4242`
5. Complete payment
6. Stripe fires `checkout.session.completed` → app creates Shopify order via `handleCheckoutCompleted()`
7. Check Shopify Admin for order tagged `headless,stripe-checkout`

### Stripe Test Cards

| Card Number         | Scenario        |
|---------------------|-----------------|
| 4242 4242 4242 4242 | Success         |
| 4000 0000 0000 0002 | Card declined   |
| 4000 0000 0000 9995 | Insufficient    |

Use any future expiry, any CVC, any billing ZIP.

---

## Verification

### Shopify Admin

- Order appears in **Orders**
- Tags include `headless` and either `zero-dollar-test` or `stripe-checkout`
- Note contains: `Source: Headless Storefront` and session/payment IDs

### Supabase

- **checkout_sessions**: Row with `status: 'completed'` and `shopify_order_id`
- **stripe_purchases** (Stripe flow only): Row with `shopify_order_id`, `status: 'completed'`

### Shopify Order Webhook (Downstream)

When the order is created in Shopify, Shopify sends `orders/create` to `/api/webhooks/shopify/orders`, which:

- Syncs order to Supabase `orders` and `order_line_items_v2`
- Creates tracking link
- Sends order confirmation email (if configured)

---

## Troubleshooting

| Issue                       | Check                                                                 |
|-----------------------------|-----------------------------------------------------------------------|
| "Checkout session not found" | `checkout_sessions` table exists; session_id matches URL param        |
| "Failed to create order"     | Shopify API credentials; variant IDs valid                            |
| Stripe webhook not firing    | Stripe CLI running; `STRIPE_WEBHOOK_SECRET` matches `stripe listen`    |
| Order not in Shopify         | Check server logs for Shopify API errors                              |
