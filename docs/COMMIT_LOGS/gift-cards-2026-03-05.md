# Gift Card Purchase and Redemption

**Date**: 2026-03-05

## Summary

Customers can now buy digital gift cards ($10–$500) via a dedicated page. Each purchase creates a unique Stripe promotion code redeemable at checkout in the existing "Add Promo Code or Gift Card" flow.

## Changes

- [x] Create `gift_cards` table ([supabase/migrations/20260305000000_gift_cards_table.sql](../../supabase/migrations/20260305000000_gift_cards_table.sql))
- [x] Add `POST /api/gift-cards/create-checkout` for Stripe Checkout Session (redirect flow) ([app/api/gift-cards/create-checkout/route.ts](../../app/api/gift-cards/create-checkout/route.ts))
- [x] Add `GET /api/gift-cards/by-session` for success page to fetch code ([app/api/gift-cards/by-session/route.ts](../../app/api/gift-cards/by-session/route.ts))
- [x] Stripe webhook: Handle `gift_card_purchase` sessions with idempotent provisioning (coupon + promo code, DB insert, email) ([app/api/stripe/webhook/route.ts](../../app/api/stripe/webhook/route.ts))
- [x] Create `/shop/gift-cards` purchase page with preset amounts, custom amount, recipient email ([app/shop/gift-cards/page.tsx](../../app/shop/gift-cards/page.tsx))
- [x] Create `/shop/gift-cards/success` page with code display and copy button ([app/shop/gift-cards/success/page.tsx](../../app/shop/gift-cards/success/page.tsx))
- [x] Update ExperienceSlideoutMenu "Buy Gift Card" href to `/shop/gift-cards` ([app/shop/experience/ExperienceSlideoutMenu.tsx](../../app/shop/experience/ExperienceSlideoutMenu.tsx))
- [x] Add feature docs ([docs/features/gift-cards/README.md](../../docs/features/gift-cards/README.md))

## Technical Notes

- Gift cards use Stripe Coupons (`amount_off`) + Promotion Codes (`max_redemptions: 1`).
- Redemption reuses existing PromoCodeModal and `validate-promo` flow; no frontend changes needed.
- Webhook is idempotent: skips provisioning if `gift_cards` row already exists for `stripe_session_id`.
- On provisioning failure: inserts `provisioning_failed` row, emails purchaser with delay notice.
- Code format: `GC-XXXXXXXX`.

## Deployment

1. Run migration `20260305000000_gift_cards_table` before deploying.
2. Ensure Stripe webhook receives `checkout.session.completed` events.
