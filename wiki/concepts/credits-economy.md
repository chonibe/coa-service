---
title: "Credits Economy (Ink-O-Gatchi)"
type: concept
tags: [feature, collector, credits, gamification, banking]
created: 2026-04-14
updated: 2026-04-14
sources: [2026-04-14-post-purchase-credits]
---

# Credits Economy (Ink-O-Gatchi)

The Credits Economy is the collector-facing engagement and loyalty system, denominated in "Ink-O-Gatchi" credits earned through purchases and spent in the platform shop.

## Definition

Every purchase earns the collector 10 credits per $1 spent. Credits are stored in `collector_ledger_entries` and surfaced on the collector dashboard via the Banking Dashboard component. Credits can be spent on platform perks. The system is tied to collector identity creation — every new purchaser automatically gets a collector account and credits deposited at checkout completion.

## Key Claims

1. Credit rate: 10 credits per $1 of purchase total.
2. Credits are deposited immediately after `handleCheckoutCompleted()` runs in the Stripe webhook.
3. Every checkout (including guest) auto-creates a Supabase auth user and `collector_profiles` record if none exists.
4. A magic-link email is sent post-purchase so collectors can sign in immediately.
5. The collector avatar system is called "InkOGatchi" — each collector gets a `collector_avatars` record.
6. Credits ledger uses the same `collector_ledger_entries` table as vendor payouts (different `transaction_type` values).
7. Banking endpoints: `GET /api/banking/collector-identifier`, `GET /api/banking/balance`, `GET /api/banking/subscriptions/manage`.
8. NFC scanning awards credits — referred to as "Ink-O-Gatchi credits upon successful authentication" in the NFC auth feature.
9. Checkout success page v1.1.1: signed-in users see only "Continue Shopping" CTA; guests see "Sign in" + "Continue Shopping" (no "View My Collection" button).

## Evidence

- [[2026-04-14-post-purchase-credits]] — Stream C1 (post-purchase bridge), C2 (wishlist), C3 (credits economy)

## Tensions

- Auto-account creation (no password) means collectors must use magic links to sign in — friction if the email link expires (7-day TTL on claim tokens).
- Credits in `collector_ledger_entries` alongside vendor payouts could create confusion — the `transaction_type` enum disambiguates but adds schema complexity.

## Related

- [[collector-dashboard]]
- [[nfc-authentication]]
- [[vendor-payout-system]]
- [[supabase]]
