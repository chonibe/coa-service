---
title: "First Edition Reserve System"
type: concept
tags: [feature, admin, edition, policy, artwork-approval]
created: 2026-04-14
updated: 2026-04-14
sources: [2026-04-14-first-edition-reserve]
---

# First Edition Reserve System

The First Edition Reserve System automatically reserves edition #1 of every approved artwork for the platform operator (`choni@thestreetlamp.com`), with public sales starting from edition #2.

## Definition

When an admin approves a vendor's artwork, a special internal reserve transaction is triggered that assigns edition #1 to `choni@thestreetlamp.com`. The artist receives their standard 25% payout on the reserve price — not the full public price. This policy is disclosed to vendors in the Vendor Terms of Service and agreed to at product submission.

## Key Claims

1. Edition #1 of every approved artwork is automatically reserved for `choni@thestreetlamp.com`.
2. The reserve triggers at admin approval — not at time of submission.
3. Artist receives 25% commission on the reserve (payout only, not full price).
4. Public sales start from edition #2.
5. `first_edition_reserves` table tracks: `product_id`, `vendor_name`, `order_id`, `line_item_id`, `reserved_by`, `purchase_price`, `payout_amount`, `status` (`reserved`/`fulfilled`/`cancelled`), `metadata`.
6. `products` table gains: `first_edition_reserved` (boolean), `first_edition_order_id` (text).
7. This policy is disclosed to vendors in Vendor Terms of Service (`docs/features/vendor-terms/VENDOR_TERMS_OF_SERVICE.md`).
8. Legal compliance: vendors agree to this at product submission.

## Evidence

- [[2026-04-14-first-edition-reserve]] — DB schema, business logic, legal disclosure reference

## Tensions

- Artists may not realise edition #1 is reserved until they see their edition numbering start at #2 — even though it's disclosed in the ToS, it may surprise them.
- The 25% payout on the reserve means the platform receives edition #1 at a fraction of retail — a financial benefit not visible in normal payout analytics.

## Related

- [[edition-numbering-system]]
- [[vendor-portal]]
- [[vendor-payout-system]]
- [[supabase]]
