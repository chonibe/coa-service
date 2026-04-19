---
title: "Artist Affiliate Program"
type: concept
tags: [feature, vendor, affiliate, commission, commerce]
created: 2026-04-14
updated: 2026-04-14
sources: [2026-04-14-affiliate-program]
---

# Artist Affiliate Program

Artists earn a 10% commission on Street Lamp sales when a customer arrives via their personal affiliate link.

## Definition

Each vendor receives a shareable affiliate link (`/shop/artists/<slug>?ref=<slug>` or short form `/r/<slug>`). When a visitor uses this link, an `affiliate_ref` cookie is set for 14 days. At checkout, the cookie resolves to a `vendor_id`, which is stored on the Shopify draft order and synced to `orders.affiliate_vendor_id`. When a lamp line item is fulfilled, 10% commission is deposited into the vendor's `collector_ledger_entries`.

## Key Claims

1. Commission rate: 10% of lamp line item price (USD).
2. Eligible products: Street Lamp (SKU `streetlamp001`, `streetlamp002`, or product name contains "street lamp").
3. Cookie TTL: 14 days from last affiliate link click.
4. Self-referral exclusion: same vendor as buyer does not earn commission.
5. Attribution flows through: affiliate link → cookie → checkout metadata (`note_attributes`) → order sync → fulfillment webhook → ledger deposit.
6. Commission appears in vendor balance alongside payouts — uses the same `collector_ledger_entries` table.
7. `collector_transaction_type` enum has an `affiliate_commission` value.
8. Short redirect: `app/r/[slug]/page.tsx` → full profile URL with `?ref=<slug>`.

## Evidence

- [[2026-04-14-affiliate-program]] — full attribution flow, DB schema, implementation links

## Tensions

- 14-day cookie attribution means a single affiliate visit can trigger commission from a much later purchase — potential for disputed attribution if the customer visited via multiple affiliate links.
- The lamp SKU list is hardcoded in `lib/affiliate.ts` — adding new lamp products requires a code change.

## Related

- [[vendor-payout-system]]
- [[vendor-portal]]
- [[shopify]]
- [[supabase]]
