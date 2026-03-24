# Shop account: shipment support email toggle – 2026-03-24

## Summary

Inside each order’s **Shipment & tracking** accordion, customers can tap **Need help with this shipment?** to reveal `support@thestreetcollector.com` and short copy explaining that email is the fastest path when delivery is unclear or difficult.

## Checklist

- [x] Add toggle + mailto (order number in subject/body when available) in [`app/(store)/shop/account/page.tsx`](../../app/(store)/shop/account/page.tsx) (`OrderShipmentAccordion`)
- [x] Bump feature doc version/changelog in [`docs/features/warehouse-order-tracking/README.md`](../features/warehouse-order-tracking/README.md)
