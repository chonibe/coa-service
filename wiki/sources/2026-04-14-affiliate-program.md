---
title: "Artist Affiliate Program Documentation"
type: source
tags: [affiliate, vendor, commission, cookies, ledger]
created: 2026-04-14
updated: 2026-04-14
sources: []
---

# Artist Affiliate Program Documentation

Feature documentation for the artist affiliate program: link format, attribution flow, commission rules, and implementation files.

## Metadata

- **Author**: The Street Collector team
- **File**: `docs/features/affiliate-program/README.md`
- **Version**: 1.0.0
- **Last Updated**: 2026-03-09

## Summary

Artists receive shareable links pointing to their profile. When a customer buys a Street Lamp after using that link (within a 14-day cookie window), the artist earns 10% commission. Attribution is tracked via a cookie → checkout note attribute → order sync → fulfillment trigger chain. Commission is deposited in the `collector_ledger_entries` table and included in the vendor's balance and next payout.

## Key Takeaways

- Full URL: `https://<site>/shop/artists/<slug>?ref=<slug>`
- Short URL: `https://<site>/r/<slug>` (→ full URL with ref)
- Cookie: `affiliate_ref` with 14-day TTL set when visitor lands via link.
- Checkout metadata: `note_attributes: [{ name: 'affiliate_vendor_id', value: '<id>' }]` on Shopify draft order.
- Order sync: `orders.affiliate_vendor_id` FK to `vendors.id`.
- Commission trigger: line item `fulfillment_status = 'fulfilled'` on a lamp product.
- Rate: 10% of lamp line item price (USD).
- Eligible: SKU `streetlamp001`, `streetlamp002`, or product name contains "street lamp".
- Self-referral excluded.
- `collector_transaction_type` enum: `affiliate_commission`.
- Key files: `lib/affiliate.ts`, `lib/banking/affiliate-commission.ts`, `lib/banking/fulfillment-credit-processor.ts`.
- Vendor dashboard shows: affiliate link card + affiliate earnings metric.

## New Information

- Slug comes from `vendor_collections.shopify_collection_handle`.
- The lamp SKU list is defined in `lib/affiliate.ts` — hardcoded, requires code change for new lamp SKUs.
- Commission is deposited by `lib/banking/affiliate-commission.ts` (not the payout calculator).

## Contradictions

None against other wiki pages.

## Entities Mentioned

- [[the-street-collector]]
- [[supabase]]
- [[shopify]]

## Concepts Touched

- [[affiliate-program]]
- [[vendor-payout-system]]
- [[vendor-portal]]
