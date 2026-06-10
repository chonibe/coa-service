---
title: "Vendor Payout System"
type: concept
tags: [feature, vendor, payments, paypal, finance]
created: 2026-04-14
updated: 2026-04-14
sources: [2026-04-14-vendor-payouts]
---

# Vendor Payout System

The Vendor Payout System calculates and processes payments to artists based on fulfilled order line items, with a minimum threshold, audit trail, and multi-method disbursement.

## Definition

When a line item's `fulfillment_status` is `'fulfilled'`, it becomes eligible for payout. The system calculates per-product payout percentages (default 25%), applies refund deductions, enforces a $25 USD minimum threshold, and pays out via PayPal Payouts API (primary), manual marking, or future alternatives. All payout actions are logged in an audit trail.

## Key Claims

1. Only `fulfillment_status = 'fulfilled'` line items are eligible — pending or unfulfilled items never pay out.
2. Default payout percentage is 25% of the line item price; this is configurable per product in `product_vendor_payouts`.
3. Minimum payout is $25 USD to reduce transaction fees; vendor-initiated via `POST /api/vendors/payouts/redeem`.
4. Refunds automatically deduct the vendor's share — tracked via `refund_status` (`none`, `partial`, `full`) and `refunded_amount` on `order_line_items_v2`.
5. PayPal Payouts API is the primary automated disbursement channel.
6. Manual payment is supported with an audit trail: `manually_marked_paid`, `marked_by` (admin email), `marked_at`.
7. PDF self-billing invoices are generated for tax compliance via `GET /api/vendors/payouts/[id]/invoice`.
8. Affiliate commission (10% on lamp sales) flows through the same `collector_ledger_entries` table as payouts.
9. Core DB tables: `order_line_items_v2`, `product_vendor_payouts`, `vendor_payouts`, `vendor_payout_items`, `collector_ledger_entries`.

## Evidence

- [[2026-04-14-vendor-payouts]] — full feature spec, DB schema, API endpoints, library files

## Tensions

- The $25 minimum means small vendors accumulate unpaid balances for longer — a UX friction point.
- Negative balances (refund exceeds payout) require admin attention; UI warns but doesn't auto-resolve.
- PayPal is the only automated channel — vendors without PayPal must use manual payout.

## Related

- [[vendor-portal]]
- [[supabase]]
- [[shopify]]
- [[affiliate-program]]
