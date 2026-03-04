# Gift Cards Enhanced: Design, Personalization, Product Types, Scheduled Send

**Date**: 2026-03-06

## Summary

Enhanced the gift card flow with recipient-centric form, design selection, gift message, sender name, scheduled delivery, and product-based gift cards (1 Street Lamp, 1 Season 1 Artwork at $40).

## Changes

- [x] Migration `20260306000000_gift_cards_enhanced`: add `design`, `gift_message`, `send_at`, `sender_name`, `gift_card_type`; allow `scheduled` status
- [x] Gift card form: Recipient's email (required), Choose a design, Choose card value (dollar / 1 Street Lamp / 1 Season 1 Artwork), Gift message, When to send (Today/Schedule), Sender's name
- [x] `GET /api/gift-cards/lamp-price`: returns current Street Lamp price from Shopify
- [x] `POST /api/gift-cards/create-checkout`: accept `giftCardType`, `design`, `giftMessage`, `sendAt`, `senderName`; support `street_lamp` and `season1_artwork` types
- [x] Webhook: store new fields; if `send_at` future, set `status=scheduled` and skip email; include sender and message in email template
- [x] Cron `send-scheduled-gift-cards`: runs hourly; sends emails for `scheduled` gift cards where `send_at <= now`
- [x] "Delivered by email, this gift card never expires" footer copy

## Technical Notes

- Street Lamp price fetched from Shopify at page load when that type is selected.
- Season 1 Artwork fixed at $40 (4000 cents).
- Scheduled send: webhook creates coupon+promo immediately; email sent by cron when `send_at` reached.
- Design options (classic, minimal, festive) stored but not yet used in email template styling.

## Deployment

1. Run migration `20260306000000_gift_cards_enhanced`
2. Ensure `CRON_SECRET` is set for scheduled gift card delivery
