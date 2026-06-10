---
title: "Warehouse Order Tracking"
type: concept
tags: [feature, warehouse, shipping, chinadivision, fulfillment]
created: 2026-04-14
updated: 2026-04-14
sources: [2026-04-14-warehouse-order-tracking]
---

# Warehouse Order Tracking

Warehouse Order Tracking provides comprehensive shipment tracking for orders fulfilled through ChinaDivision, with admin dashboards, shareable tracking links, and customer-facing shipment detail in the shop account.

## Definition

Orders fulfilled through the ChinaDivision warehouse are tracked via the `ChinaDivisionClient` (`lib/chinadivision/client.ts`). Admins can view all warehouse orders with date range filtering and generate shareable tracking links (no login required). Customers see per-order shipment accordions on their shop account page. Gift orders (50+ recipients) have a dedicated tracking dashboard.

## Key Claims

1. ChinaDivision is the primary physical fulfilment warehouse.
2. `ChinaDivisionClient` methods: `getOrderInfo(orderId)`, `getOrdersInfo(start, end)`, `getOrderTrack(orderId)`.
3. Admin: `GET /api/warehouse/orders?start=YYYY-MM-DD&end=YYYY-MM-DD` — requires admin session.
4. Customer shop account: per-order **Shipment & tracking** accordion with STONE3PL-style timeline — uses Supabase session, NOT Shopify customer cookie.
5. Auto-fulfillment route: `app/api/warehouse/orders/auto-fulfill/route.ts`.
6. Shareable tracking links: no auth required for public tracking page.
7. Gift order dashboard: for customers with 50+ recipients.
8. Carrier tracking URL helper: `lib/shipping/carrier-tracking-url.ts`.
9. Notification template: `lib/notifications/tracking-link.ts`.
10. Version: 1.1.4; support email toggle added 2026-03-24.

## Evidence

- [[2026-04-14-warehouse-order-tracking]] — full feature spec, API list, client class

## Tensions

- The shop account shipment tracking uses Supabase session (not Shopify customer cookie) — a different auth from the rest of the collector dashboard, which uses Shopify cookies.
- ChinaDivision API dependency: outages at the warehouse API break tracking visibility for all orders.

## Related

- [[shopify]]
- [[supabase]]
- [[collector-dashboard]]
- [[headless-architecture]]
