---
title: "First Edition Reserve System Documentation"
type: source
tags: [edition, admin, policy, vendor-terms, database]
created: 2026-04-14
updated: 2026-04-14
sources: []
---

# First Edition Reserve System Documentation

Feature documentation for the automatic reservation of edition #1 for the platform operator on every approved artwork.

## Metadata

- **Author**: The Street Collector team
- **File**: `docs/features/first-edition-reserve/README.md`
- **Date**: Living document, last observed 2026-04-14

## Summary

When an admin approves a vendor artwork, a system-generated internal reserve transaction assigns edition #1 to `choni@thestreetlamp.com`. The artist receives 25% commission on the reserve. Public sales start from edition #2. The policy is disclosed in the Vendor Terms of Service.

## Key Takeaways

- Trigger: admin approval action.
- Beneficiary: `choni@thestreetlamp.com` (platform operator).
- Artist payout: 25% of reserve price (same rate as normal sales).
- `first_edition_reserves` table: `id`, `product_id`, `vendor_name`, `order_id`, `line_item_id`, `reserved_at`, `reserved_by`, `purchase_price`, `payout_amount`, `status`, `metadata`.
- `products` extensions: `first_edition_reserved` (boolean), `first_edition_order_id` (text).
- Legal: disclosed in `docs/features/vendor-terms/VENDOR_TERMS_OF_SERVICE.md`, agreed at submission.
- Status values: `reserved`, `fulfilled`, `cancelled`.

## New Information

- The reserve is tracked as a "special internal reserve order" — not a normal Shopify order.
- `metadata` JSONB on `first_edition_reserves` allows future extension without schema migration.

## Contradictions

None against other wiki pages.

## Entities Mentioned

- [[the-street-collector]]
- [[supabase]]

## Concepts Touched

- [[first-edition-reserve]]
- [[edition-numbering-system]]
- [[vendor-payout-system]]
- [[vendor-portal]]
