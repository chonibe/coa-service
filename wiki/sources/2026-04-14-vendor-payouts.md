---
title: "Vendor Payout System Documentation"
type: source
tags: [vendor, payouts, paypal, finance, database]
created: 2026-04-14
updated: 2026-04-14
sources: []
---

# Vendor Payout System Documentation

Feature documentation for the fulfillment-based vendor payout system with PayPal integration, audit trail, refund deduction, and PDF invoicing.

## Metadata

- **Author**: The Street Collector team
- **File**: `docs/features/vendor-payouts/README.md`
- **Date**: Living document, last observed 2026-04-14

## Summary

The payout system calculates vendor earnings based on fulfilled `order_line_items_v2` records. Payout percentages are configurable per product (default 25%). The minimum payout threshold is $25 USD to reduce transaction fees. Vendors initiate payouts themselves via the dashboard; admins can manually mark items as paid. PayPal Payouts API is the primary automated channel.

Refunds automatically deduct the vendor's share — tracked on `order_line_items_v2` with `refund_status`, `refunded_amount`, and `refunded_at`. Vendors with negative balances (more refunds than earnings) receive UI warnings. PDF invoices are generated for tax compliance.

Affiliate commission (10% on lamp sales via referral links) is stored in the same `collector_ledger_entries` table with `transaction_type = 'affiliate_commission'`.

## Key Takeaways

- Only fulfilled line items are payout-eligible.
- Default payout: 25% of line item price; configurable per product.
- Minimum: $25 USD (constant in `lib/payout-calculator.ts`).
- PayPal Payouts API for automated disbursement; `payout_batch_id` tracks PayPal batch.
- Manual payment: `manually_marked_paid`, `marked_by`, `marked_at` fields on items.
- Refund deduction is automatic; negative balances generate warnings.
- PDF invoice: `GET /api/vendors/payouts/[id]/invoice`.
- DB functions: `get_pending_vendor_payouts()`, `get_vendor_balance(vendor_name)`, `get_vendor_payout_by_order()`.
- Libraries: `lib/payout-calculator.ts`, `lib/payout-validator.ts`, `lib/vendor-payout-readiness.ts`.
- `collector_ledger_entries` is the unified ledger for payouts, commissions, and withdrawals.

## New Information

- Payout readiness is a separate prerequisite check (`GET /api/vendor/payout-readiness`) before a vendor can request withdrawal.
- PayPal batch status can be manually checked via `GET /api/vendors/payouts/check-status`.
- Negative balance warnings are surfaced in the admin UI — admin must manually intervene.

## Contradictions

None against other wiki pages.

## Entities Mentioned

- [[the-street-collector]]
- [[supabase]]
- [[shopify]]

## Concepts Touched

- [[vendor-payout-system]]
- [[affiliate-program]]
- [[vendor-portal]]
