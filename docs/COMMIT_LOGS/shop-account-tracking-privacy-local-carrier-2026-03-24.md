# Shop account tracking: privacy + local carrier links – 2026-03-24

## Summary

My Orders **Shipment & tracking** no longer lists warehouse SKUs/packages. Customers see shipment status, a longer **tracking journey** (locations/events), and a **Local delivery partner** block with carrier name and a **clickable** last-mile tracking number (carrier-specific URL or STONE3PL fallback).

## Checklist

- [x] Remove package/SKU list from [`app/(store)/shop/account/page.tsx`](../../app/(store)/shop/account/page.tsx); optional warehouse status line when STONE3PL payload is missing
- [x] Add [`lib/shipping/carrier-tracking-url.ts`](../../lib/shipping/carrier-tracking-url.ts) (`getCarrierTrackingPageUrl`)
- [x] Refactor compact [`TrackingTimeline`](../../app/admin/warehouse/orders/components/TrackingTimeline.tsx): `compactMaxEvents`, local panel always when carrier/last-mile data exists, journey section, linked last mile in full view
- [x] Merge carrier/last-mile from API `tracking` + ChinaDivision on account page
- [x] Update [`docs/features/warehouse-order-tracking/README.md`](../features/warehouse-order-tracking/README.md)
