# Scarcity Counter Accuracy Fix (2026-03-19)

## Summary

Fixes inaccuracies in the scarcity bar/counter shown on artwork detail in the Experience page. The bar displays remaining inventory as a percentage of edition size.

## Changes

### 1. Quantity API — sum across all variants

- **File**: [`app/api/shop/products/by-id/[id]/quantity/route.ts`](../../app/api/shop/products/by-id/[id]/quantity/route.ts)
- **Issue**: Previously used `firstVariant.inventory_quantity ?? total`. For products with multiple variants (e.g. sizes), only the first variant's inventory was returned, undercounting total available stock.
- **Fix**: Always use the sum of inventory across all variants (`totalFromVariants`). For single-variant limited editions this is unchanged; for multi-variant products the count is now correct.

### 2. Quantity API — Inventory Levels fallback

- **Issue**: Shopify has deprecated `inventory_quantity` on ProductVariant in the REST Admin API. Some stores may not return it, causing the API to return `null`.
- **Fix**: When no variant has `inventory_quantity` defined, fall back to the Inventory Levels API (`/admin/api/2024-01/inventory_levels.json?inventory_item_ids=...`). Sum the `available` quantity across all locations for the product's variants.

### 3. ScarcityBadge — cap percentage at 100%

- **File**: [`app/(store)/shop/experience-v2/components/ScarcityBadge.tsx`](../../app/(store)/shop/experience-v2/components/ScarcityBadge.tsx)
- **Issue**: When `quantityAvailable` exceeded `editionSize` (e.g. data sync mismatch), the bar could show >100%.
- **Fix**: Cap `percentRemaining` at 100% so the bar never exceeds full.

## Checklist

- [x] [`app/api/shop/products/by-id/[id]/quantity/route.ts`](../../app/api/shop/products/by-id/[id]/quantity/route.ts) — Use total inventory across variants; add Inventory Levels fallback
- [x] [`app/(store)/shop/experience-v2/components/ScarcityBadge.tsx`](../../app/(store)/shop/experience-v2/components/ScarcityBadge.tsx) — Cap scarcity bar at 100%
- [x] [`docs/features/experience/README.md`](../../docs/features/experience/README.md) — Document scarcity counter behavior

## Testing

1. Open an artwork detail in the Experience page.
2. Verify the scarcity bar reflects the correct remaining percentage.
3. For multi-variant products (if any), confirm the total available is the sum of all variants.
4. When edition size is set and inventory is higher, bar should cap at 100%.

## Version

- Last updated: 2026-03-19
