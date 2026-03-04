# Gift Cards

## Overview

Gift cards allow customers to purchase digital vouchers redeemable at checkout. Each gift card generates a unique Stripe promotion code that can be applied in the "Add Promo Code or Gift Card" field during checkout.

**Implementation**: [`app/shop/gift-cards/`](../../../app/shop/), [`app/api/gift-cards/`](../../../app/api/gift-cards/)

## Architecture

- **Purchase**: User selects amount ($25–$500), optionally enters recipient email, and completes Stripe Checkout (redirect).
- **Provisioning**: On `checkout.session.completed`, webhook creates Stripe coupon + promotion code, stores in `gift_cards` table, and emails the code.
- **Redemption**: Existing promo flow via PromoCodeModal and `/api/checkout/validate-promo`; Stripe applies the discount at checkout.

## API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/gift-cards/create-checkout` | Creates Stripe Checkout Session for gift card purchase |
| `GET /api/gift-cards/by-session?session_id=xxx` | Returns gift card code for completed session (success page) |

## Database

- **Table**: `gift_cards` (see `supabase/migrations/20260305000000_gift_cards_table.sql`)
- **Columns**: `code`, `stripe_coupon_id`, `stripe_promotion_code_id`, `amount_cents`, `purchaser_email`, `recipient_email`, `status`, `stripe_session_id`, etc.
- **Statuses**: `issued`, `redeemed`, `provisioning_failed`

## Pages

| Path | Purpose |
|------|---------|
| `/shop/gift-cards` | Purchase page: amount selection, recipient email, checkout CTA |
| `/shop/gift-cards/success` | Success page: displays code, copy button, links to shop |

## Navigation

"Buy Gift Card" in the experience slideout menu links to `/shop/gift-cards`.

## Key Implementation Details

- **Idempotency**: Webhook checks for existing `gift_cards` row by `stripe_session_id` before provisioning.
- **Failure handling**: If Stripe coupon/promo creation fails, inserts `provisioning_failed` row and emails purchaser with delay notice.
- **Code format**: `GC-XXXXXXXX` (8 alphanumeric chars).
- **Amount limits**: $10–$500 (1000–50000 cents).

## Version

- Last updated: 2026-03-05
- Version: 1.0.0
