---
title: "Post-Purchase Credits & Collector Identity (Track C)"
type: source
tags: [collector, credits, post-purchase, identity, wishlist]
created: 2026-04-14
updated: 2026-04-14
sources: []
---

# Post-Purchase Credits & Collector Identity (Track C)

Feature documentation for Track C: auto-creation of collector identity at checkout, server-synced wishlist, and credits economy expansion.

## Metadata

- **Author**: The Street Collector team
- **File**: `docs/features/post-purchase-credits/README.md`
- **Version**: 1.1.1
- **Last Updated**: 2026-04-14

## Summary

Track C has three streams. Stream C1 (Post-Purchase Bridge): every checkout — including guest — now automatically creates a Supabase auth user (no password), a `collector_profiles` record, a `collector_accounts` record, and awards credits. A magic-link email is sent immediately so the collector can sign in without setting a password. Stream C2 (Server-Synced Wishlist): persists wishlist server-side for cross-device sync. Stream C3 (Credits Economy Expansion): surfaces credits throughout the shop.

The claim token system (`lib/auth/claim-token.ts`) supports HMAC-signed tokens (7-day TTL) for email-based collection claims as a fallback to the magic link.

v1.1.1 change: checkout success page no longer shows "View My Collection" for signed-in users — only "Continue Shopping". Guests see "Sign in" + "Continue Shopping".

## Key Takeaways

- Every checkout auto-creates: Supabase auth user (`email_confirm: true`), `collector_profiles`, `collector_accounts`, `collector_avatars` (InkOGatchi), collector role in `user_roles`.
- Credits deposited immediately: 10 per $1 of purchase total.
- Magic link sent post-purchase — redirects to `/collector/dashboard`.
- Claim token: `lib/auth/claim-token.ts`; `HMAC-signed`, 7-day TTL, reuses `COLLECTOR_SESSION_SECRET` or `VENDOR_SESSION_SECRET`.
- Claim URL via `buildClaimUrl(email, purchaseId)`.
- `bridgePostPurchase()` in `app/api/stripe/webhook/route.ts` orchestrates the whole flow.
- Checkout success: signed-in → "Continue Shopping" only; guest → "Sign in" + "Continue Shopping".

## New Information

- Guest purchases now create a Supabase user with `email_confirm: true` and no password — passwordless by design.
- `getOrCreateCollectorAccount()` is the idempotent banking account creator.
- The `collector_avatars` table is the InkOGatchi avatar system.
- `lib/auth/claim-token.ts` is separate from the NFC token utilities in `lib/nfc/token.ts`.

## Contradictions

None against other wiki pages.

## Entities Mentioned

- [[the-street-collector]]
- [[supabase]]
- [[shopify]]

## Concepts Touched

- [[credits-economy]]
- [[collector-dashboard]]
- [[rbac]]
