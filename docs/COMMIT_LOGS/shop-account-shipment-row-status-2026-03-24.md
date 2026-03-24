# Commit log: shipment row inline status (My Account)

**Date:** 2026-03-24

## Checklist

- [x] [`app/(store)/shop/account/page.tsx`](../../app/(store)/shop/account/page.tsx) — For `shipped` and `out_for_delivery`, hide `StatusBadge` in the order header; show `StatusBadge` + optional `warehouseStatusLabel` (e.g. In Transit) inline on the **Shipment & tracking** `CollapsibleTrigger`, separated by a middle dot.

## Commit

`dcb46b596` — *fix(shop/account): show Shipped / In Transit inline on Shipment & tracking row*
