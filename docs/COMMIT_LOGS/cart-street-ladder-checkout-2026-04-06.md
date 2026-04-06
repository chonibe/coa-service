# Commit log: Cart + checkout use Street ladder pricing

**Date:** 2026-04-06

## Checklist

- [x] [lib/shop/street-ladder-line-pricing.ts](../../lib/shop/street-ladder-line-pricing.ts) — Pure helper `applyStreetLadderUsdToLineItems`
- [x] [lib/shop/resolve-street-ladder-prices-server.ts](../../lib/shop/resolve-street-ladder-prices-server.ts) — Supabase-backed ladder map (same logic as `/api/shop/edition-states`)
- [x] [lib/shop/street-ladder-line-pricing.test.ts](../../lib/shop/street-ladder-line-pricing.test.ts) — Jest coverage for apply helper
- [x] [app/api/checkout/create/route.ts](../../app/api/checkout/create/route.ts) — Reprice line items before Stripe + DB session
- [x] [app/api/checkout/create-checkout-session/route.ts](../../app/api/checkout/create-checkout-session/route.ts) — Experience embedded checkout repricing
- [x] [app/api/checkout/stripe/route.ts](../../app/api/checkout/stripe/route.ts) — Optional `shopifyProductId` + server ladder override (cents)
- [x] [lib/shop/CartContext.tsx](../../lib/shop/CartContext.tsx) — Fetch edition-states for cart SKUs; `effectiveUnitUsd`; subtotal from ladder; merge add refreshes `price`
- [x] [components/impact/LocalCartDrawer.tsx](../../components/impact/LocalCartDrawer.tsx) — `getDisplayUnitPrice` for line display
- [x] [app/(store)/layout.tsx](../../app/(store)/layout.tsx) — Drawer + `/api/checkout/stripe` use ladder-aware amounts
- [x] [components/sections/TransparentHeader.tsx](../../components/sections/TransparentHeader.tsx) — Pass display price fn into drawer
- [x] [app/(store)/shop/cart/page.tsx](../../app/(store)/shop/cart/page.tsx) — Line unit display uses `effectiveUnitUsd`

## Why

Cart lines stored Shopify variant list price from `addItem`. Checkout APIs trusted client `price`, so totals stayed on Shopify even when the Street ladder (from `products.edition_counter` / `edition_size`) differed.

## Notes

- Products must exist in Supabase `products` with `product_id` aligned to Shopify for ladder to apply.
- Reserve lock pricing is unchanged here (still experience / auth paths).
