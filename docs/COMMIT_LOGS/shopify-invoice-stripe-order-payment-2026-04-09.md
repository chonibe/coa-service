# Commit log: Shopify invoice URLs → Stripe Checkout (2026-04-09)

## Checklist

- [x] **[app/[shopKey]/order_payment/[orderId]/route.ts](../../app/[shopKey]/order_payment/[orderId]/route.ts)** — `GET` handler: rate limit, validate `secret`, probe invoice URL on `SHOPIFY_SHOP`, load outstanding balance via Admin GraphQL, create Stripe Checkout Session, redirect to Stripe.
- [x] **[lib/shopify/order-invoice-stripe.ts](../../lib/shopify/order-invoice-stripe.ts)** — Admin GraphQL helpers: `getOrderInvoicePayEligibility`, `orderMarkAsPaid`, `validateShopifyHostedOrderPaymentUrl`.
- [x] **[app/api/stripe/webhook/route.ts](../../app/api/stripe/webhook/route.ts)** — `checkout.session.completed` branch for `metadata.source === shopify_order_invoice`: amount check, `orderMarkAsPaid`, `stripe_purchases` row (no new draft order).
- [x] **[docs/DOMAIN_AND_AFFILIATE_REDIRECTS.md](../../docs/DOMAIN_AND_AFFILIATE_REDIRECTS.md)** — Documented invoice URL behaviour and env vars.
- [x] **[docs/VERCEL_ENV_VARIABLES.md](../../docs/VERCEL_ENV_VARIABLES.md)** — Optional `SHOPIFY_INVOICE_PAY_SHOP_SEGMENT` and scope note.

## Context

Shopify payment links like `/{segment}/order_payment/{orderId}?secret=…` were hitting the custom domain served by this Next.js app, matching no route, and **`app/not-found.tsx`** redirected users to `/`. This flow now sends customers to Stripe for the outstanding balance and marks the existing Shopify order paid after webhook confirmation.

## Testing

- [ ] Manual: open a real invoice URL on production (after deploy) and complete a test card payment; confirm Shopify order financial status updates and `stripe_purchases` contains the session.

## Version

- lastUpdated: 2026-04-09
