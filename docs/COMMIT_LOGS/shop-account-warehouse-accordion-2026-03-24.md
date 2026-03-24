# Shop account warehouse accordion – 2026-03-24

## Summary

Logged-in customers (including experience-menu / Supabase auth) can open a **Shipment & tracking** accordion on each order on **My Orders** (`/shop/account`) to see ChinaDivision package rows and a STONE3PL-style timeline without using the Shopify customer cookie or the admin tracking API.

## Checklist

- [x] Add shared resolver [`lib/warehouse/shop-account-order-detail.ts`](../../lib/warehouse/shop-account-order-detail.ts) (order ownership, `warehouse_orders` match, ChinaDivision live fetch + SKU enrichment, STONE3PL timeline formatting)
- [x] Add [`GET /api/shop/account/orders/[orderId]/warehouse-detail`](../../app/api/shop/account/orders/[orderId]/warehouse-detail/route.ts) (Supabase session + mock dev cookie parity with list orders)
- [x] Extend [`TrackingTimeline`](../../app/admin/warehouse/orders/components/TrackingTimeline.tsx) with `staticTracking` / `onRefetch` so shop account can render server-fetched tracking without `/api/tracking/stone3pl`
- [x] Add per-order [`OrderShipmentAccordion`](../../app/(store)/shop/account/page.tsx) on My Orders (lazy load on expand, retry, empty states)
- [x] Update feature doc [`docs/features/warehouse-order-tracking/README.md`](../features/warehouse-order-tracking/README.md) (v1.1.2)

## Deployment

- No migration or new env vars; requires existing `CHINADIVISION_API_KEY` and STONE3PL/ChinaDivision configuration used elsewhere.
- Manual QA: sign in → `/shop/account` → expand **Shipment & tracking** on an order with warehouse data.
