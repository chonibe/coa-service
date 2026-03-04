# Gift Cards

## Overview

Gift cards allow customers to purchase digital vouchers redeemable at checkout. Each gift card generates a unique Stripe promotion code that can be applied in the "Add Promo Code or Gift Card" field during checkout.

**Implementation**: [`app/shop/gift-cards/`](../../../app/shop/), [`app/api/gift-cards/`](../../../app/api/gift-cards/)

## Architecture

- **Purchase**: User selects type (dollar amount, 1 Street Lamp, 1 Season 1 Artwork), recipient email, design, gift message, send date, sender name. Completes Stripe Checkout (redirect).
- **Provisioning**: On `checkout.session.completed`, webhook creates Stripe coupon + promotion code, stores in `gift_cards` table. Emails immediately if "Today", or sets `scheduled` for future send date.
- **Scheduled delivery**: Cron `/api/cron/send-scheduled-gift-cards` runs hourly; sends emails for `status='scheduled'` where `send_at <= now`.
- **Redemption**: Existing promo flow via PromoCodeModal and `/api/checkout/validate-promo`; Stripe applies the discount at checkout.

## Gift Card Types

| Type | Amount | Redemption |
|------|--------|------------|
| `value` | $10–$500 (preset or custom) | $ off any purchase |
| `street_lamp` | Current Street Lamp price from Shopify | Redeemable for 1 Street Lamp |
| `season1_artwork` | $40 fixed | Redeemable for any Season 1 artwork |

## API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/gift-cards/create-checkout` | Creates Stripe Checkout Session for gift card purchase |
| `GET /api/gift-cards/by-session?session_id=xxx` | Returns gift card code for completed session (success page) |
| `GET /api/gift-cards/lamp-price` | Returns current Street Lamp price from Shopify |

## Database

- **Table**: `gift_cards` (see migrations `20260305000000`, `20260306000000`)
- **Columns**: `code`, `stripe_coupon_id`, `amount_cents`, `purchaser_email`, `recipient_email`, `design`, `gift_message`, `send_at`, `sender_name`, `gift_card_type`, `status`, etc.
- **Statuses**: `issued`, `scheduled`, `redeemed`, `provisioning_failed`

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
