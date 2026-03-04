# Saved Payment Methods for Returning Customers

**Date**: 2026-03-03

## Summary

Returning customers can now reuse saved payment methods (cards, Link, etc.) without re-entering details. Stripe stores payment methods on the customer; we persist the Stripe Customer ID in our database and pass it on subsequent checkouts.

## Changes

- [x] Add `stripe_customer_id` to `collector_profiles` table ([supabase/migrations/20260303000000_add_stripe_customer_to_collector_profiles.sql](../../supabase/migrations/20260303000000_add_stripe_customer_to_collector_profiles.sql))
- [x] `create-checkout-session`: Look up Stripe customer by email from `collector_profiles` or `collectors`; pass `customer` when found, otherwise `customer_email` ([app/api/checkout/create-checkout-session/route.ts](../../app/api/checkout/create-checkout-session/route.ts))
- [x] Stripe webhook: On `checkout.session.completed`, persist `session.customer` to `collector_profiles` and `collectors` by purchaser email ([app/api/stripe/webhook/route.ts](../../app/api/stripe/webhook/route.ts))
- [x] Update experience feature docs ([docs/features/experience/README.md](../../docs/features/experience/README.md))

## Technical Notes

- Card/Link details stay in Stripe; we only store the Customer ID.
- `setup_future_usage: 'off_session'` was already set; this change ensures we reuse the same customer across sessions.
- Lookup is case-insensitive by email; updates apply to both `collector_profiles` (experience flow) and `collectors` (membership/headless flow).

## Deployment

Run migration `20260303000000_add_stripe_customer_to_collector_profiles` before deploying API changes.
