# Auto-Create Collector Account at Checkout

**Date:** 2026-03-01  
**Feature:** Post-purchase bridge enhancement — auto-signup  
**Related:** [post-purchase-credits/README.md](../features/post-purchase-credits/README.md)

## Summary

Customers who purchase via Stripe now get a Supabase auth account created automatically at checkout. They can log in immediately with their email (magic link) to view orders and track shipments—no separate claim flow required.

## Changes Made

### Implementation Checklist

- [x] Modified `bridgePostPurchase()` in [`app/api/stripe/webhook/route.ts`](../../app/api/stripe/webhook/route.ts)
  - Creates Supabase auth user via `auth.admin.createUser({ email, email_confirm: true })`
  - Handles existing-user case by searching `listUsers()` when createUser returns duplicate error
- [x] Links `collector_profiles` to `user_id` (create with user_id or update stub)
- [x] Inserts collector role in `user_roles` with source `purchase_auto_signup`
- [x] Ensures `collector_avatars` entry for InkOGatchi (non-critical)
- [x] Replaces claim email with "View your order" email containing magic link
- [x] Uses `auth.admin.generateLink({ type: 'magiclink', email })` for one-click sign-in URL
- [x] Fallback to `/login?email=...` when magic link unavailable (e.g. createUser failed)
- [x] Removed `buildClaimUrl` import (claim token no longer used for new purchasers)
- [x] Updated [`docs/features/post-purchase-credits/README.md`](../features/post-purchase-credits/README.md) — v1.1.0

### Files Modified

| File | Change |
|------|--------|
| `app/api/stripe/webhook/route.ts` | Rewrote `bridgePostPurchase` for auto-account creation |
| `docs/features/post-purchase-credits/README.md` | Updated Stream C1 docs |

## User Flow

**Before:** Purchase → stub profile (user_id null) → claim email → user clicks claim → magic link → sign in  
**After:** Purchase → auth user created → profile linked → "View your order" email with magic link → one-click sign-in → dashboard

## Edge Cases Handled

- User already has auth account: `createUser` fails → `listUsers` lookup by email → link profile
- Profile exists with user_id null: update profile with new user_id
- createUser fails for other reasons: send fallback email with login link
- Duplicate/race conditions: idempotent inserts with duplicate-error handling

## Testing Notes

- Verify Stripe webhook `checkout.session.completed` triggers full flow
- Confirm email contains magic link when auth user exists
- Check `/collector/dashboard` loads after clicking magic link
