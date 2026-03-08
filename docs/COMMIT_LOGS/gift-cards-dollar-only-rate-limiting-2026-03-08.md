# Gift Cards: Dollar-Only + Rate Limiting

**Date:** 2026-03-08  
**Commit:** Gift cards: dollar-only, server-side amount validation; add rate limiting

## Summary

- Gift cards are now **dollar-value only** (no item-based options). Server enforces amount bounds.
- **Rate limiting** added for gift card and checkout payment endpoints to reduce abuse.

## Checklist of changes

- [x] Gift card API ([`app/api/gift-cards/create-checkout/route.ts`](../../app/api/gift-cards/create-checkout/route.ts)): Remove `giftCardType` (street_lamp, season1_artwork); accept only `amountCents`; always validate amount against MIN_AMOUNT_CENTS (10) and MAX_AMOUNT_CENTS (50000)
- [x] Gift card API: Set metadata and line item to `gift_card_type: 'value'` only
- [x] Gift card API: Apply rate limit (10 requests/minute per IP) via [`lib/rate-limit.ts`](../../lib/rate-limit.ts)
- [x] Gift card page ([`app/shop/gift-cards/page.tsx`](../../app/shop/gift-cards/page.tsx)): Remove "1 Street Lamp" and "1 Season 1 Artwork ($40)" options; show only presets ($25, $50, $100, $200) and custom amount input
- [x] Gift card page: Remove `giftCardType` state, lamp price fetch, and related logic; stop sending `giftCardType` in create-checkout request
- [x] Add [`lib/rate-limit.ts`](../../lib/rate-limit.ts): In-memory rate limiter (IP-based, configurable limit/window); `checkRateLimit`, `getClientIdentifier`
- [x] Apply rate limiting to [`app/api/checkout/create/route.ts`](../../app/api/checkout/create/route.ts) (20/min)
- [x] Apply rate limiting to [`app/api/checkout/create-checkout-session/route.ts`](../../app/api/checkout/create-checkout-session/route.ts) (20/min)
- [x] Apply rate limiting to [`app/api/checkout/create-payment-intent/route.ts`](../../app/api/checkout/create-payment-intent/route.ts) (20/min)
- [x] Apply rate limiting to [`app/api/checkout/complete-order/route.ts`](../../app/api/checkout/complete-order/route.ts) (30/min)
- [x] Update [`docs/features/gift-cards/README.md`](../../docs/features/gift-cards/README.md): Dollar-only types, rate limiting note, remove lamp-price endpoint from table

## Notes

- Webhook and cron still support legacy `gift_card_type` values for existing DB rows (email copy).
- Rate limiter is per serverless instance (in-memory); not shared across Vercel workers.
