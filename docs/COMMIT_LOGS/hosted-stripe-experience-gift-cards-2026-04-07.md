# Commit log: Hosted Stripe checkout (experience OrderBar + gift cards)

**Date:** 2026-04-07  
**Branch:** `payment/hosted-checkout`

## Summary

Replaced embedded Stripe Custom Checkout (Payment Element) with **Stripe-hosted Checkout** for the experience **OrderBar** and **digital gift cards**, matching the existing cart flow (`POST /api/checkout/create` / `session.url`).

## Checklist

- [x] [`app/(store)/shop/experience-v2/components/OrderBar.tsx`](../../app/(store)/shop/experience-v2/components/OrderBar.tsx) — Removed `PaymentStep`, address/billing modals, `CheckoutProvider` wrapper; **Continue to secure checkout** → `POST /api/checkout/create` with `buildLineItems()`, `promoCode`, `customerEmail`, `shippingRequired`, `cancelUrl` with `?cancelled=true`; GA `trackBeginCheckout` after session creation; loading state on CTA.
- [x] [`lib/shop/experience-journey-next-action.ts`](../../lib/shop/experience-journey-next-action.ts) — Optional `stripeHostedInDrawer`; when true and drawer open with artworks → `place_order` pulse (skips legacy address/payment substeps).
- [x] [`lib/shop/experience-journey-next-action.test.ts`](../../lib/shop/experience-journey-next-action.test.ts) — Test for hosted drawer branch.
- [x] [`app/api/gift-cards/create-checkout/route.ts`](../../app/api/gift-cards/create-checkout/route.ts) — Hosted session: `success_url` / `cancel_url`, return `{ url, sessionId }` (no `clientSecret` / `ui_mode: custom`).
- [x] [`app/(store)/shop/gift-cards/page.tsx`](../../app/(store)/shop/gift-cards/page.tsx) — Redirect to `data.url`; `useSearchParams` cancel banner; removed drawer state.
- [x] **Deleted** [`app/(store)/shop/gift-cards/components/GiftCardCheckoutDrawer.tsx`](../../app/(store)/shop/gift-cards/components/GiftCardCheckoutDrawer.tsx).
- [x] [`docs/features/experience-v2/README.md`](../../docs/features/experience-v2/README.md) — Cart integration + changelog entry for hosted checkout.

## Intentionally unchanged

- [`components/shop/checkout/PaymentStep.tsx`](../../components/shop/checkout/PaymentStep.tsx) + [`app/api/checkout/create-checkout-session/route.ts`](../../app/api/checkout/create-checkout-session/route.ts) — Still used by [`PaymentMethodsModal`](../../components/shop/checkout/PaymentMethodsModal.tsx) if mounted elsewhere.

## Testing

- `npm test -- lib/shop/experience-journey-next-action.test.ts` — pass.
- Manual: experience drawer → hosted Checkout → success; gift card buy → hosted Checkout → success; cancel URLs show banner (gift cards) / `?cancelled=true` on experience.

## Deploy

- After merge: `vercel --prod --yes` (per `.cursorrules`); record outcome here when run.
