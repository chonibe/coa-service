---
title: "Warehouse Order Tracking Documentation"
type: source
tags: [warehouse, fulfillment, chinadivision, shipping, tracking]
created: 2026-04-14
updated: 2026-04-14
sources: []
---

# Warehouse Order Tracking Documentation

Feature documentation for the ChinaDivision warehouse integration: admin dashboards, shareable tracking links, customer shipment accordion, and auto-fulfillment.

## Metadata

- **Author**: The Street Collector team
- **File**: `docs/features/warehouse-order-tracking/README.md`
- **Version**: 1.1.4
- **Change log**: Support email toggle (2026-03-24); carrier tracking URL helper; ChinaDivision auto-fulfillment + email automation (2025-12-11)

## Summary

ChinaDivision is the primary physical fulfilment partner. The `ChinaDivisionClient` class provides order info, date-range batch retrieval, and tracking data. Admin can filter by date range and generate shareable tracking links. Customers see per-order shipment accordions on their shop account page (uses Supabase session auth, not Shopify cookies). Gift-order dashboard handles 50+ recipient orders.

Auto-fulfillment route processes ChinaDivision webhook data and updates Shopify fulfillment records.

## Key Takeaways

- `lib/chinadivision/client.ts`: `ChinaDivisionClient` with `getOrderInfo`, `getOrdersInfo`, `getOrderTrack`.
- Admin: `GET /api/warehouse/orders` (date range), requires admin session.
- Auto-fulfill: `app/api/warehouse/orders/auto-fulfill/route.ts`.
- Customer: shop account shipment accordion — **Supabase session auth** (not Shopify cookie).
- Shareable tracking: no auth required on public tracking page.
- Gift orders: dedicated dashboard for 50+ recipients.
- Carrier tracking URL: `lib/shipping/carrier-tracking-url.ts`.
- Notification template: `lib/notifications/tracking-link.ts`.
- Customer toggle: support email + copy revealed inside shipment accordion (added 2026-03-24).

## New Information

- The My Orders shipment accordion uses Supabase session rather than Shopify customer cookie — an important auth exception to the normal collector pattern.
- ChinaDivision is referred to in some places as the warehouse and in others as "chinadivision" (lowercase) — both refer to the same integration.

## Contradictions

> **[CONFLICT]** The main System SSOT states customer auth should use Shopify cookies. The warehouse My Orders accordion uses Supabase session. These are different surfaces — not a direct conflict — but devs should be aware of the auth difference in the shop account page vs. the collector dashboard.

## Entities Mentioned

- [[the-street-collector]]
- [[supabase]]
- [[shopify]]

## Concepts Touched

- [[warehouse-order-tracking]]
- [[collector-dashboard]]
- [[headless-architecture]]
