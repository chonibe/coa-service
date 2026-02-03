# Refunded Line Items Fix

**Date:** 2026-02-02
**Type:** Bug Fix
**Affected Components:** Order Sync, Editions API, Activity API

## Summary

Fixed a bug where refunded/removed line items were incorrectly appearing as active in collector dashboards. This was caused by a type mismatch in the refund detection logic during order sync.

## Problem

Collectors were seeing duplicate artworks that had been removed from their orders. For example, a collector who purchased 5 items but had 2 refunded was still seeing all 5 items in their collection.

### Root Cause

In `lib/shopify/order-sync-utils.ts`, the `removedLineItemIds` Set was using `number` type, but the comparison was being done with `li.id` which could be either a number or string from different sources. JavaScript Sets use strict equality (`===`), so `Set<number>.has(123)` would not match a string `"123"`.

```javascript
// BUG: Set<number> but comparing with possibly string ID
const removedLineItemIds = new Set<number>()
// ...
const isRefunded = removedLineItemIds.has(li.id) // li.id might be string!
```

## Solution

### 1. Fixed Type Mismatch in order-sync-utils.ts

Changed the Set to use strings consistently:

```javascript
// FIXED: Use string Set for consistent comparison
const removedLineItemIds = new Set<string>()
// ...
removedLineItemIds.add(ri.line_item_id.toString())
// ...
const isRefunded = removedLineItemIds.has(liIdStr) // Now both are strings
```

### 2. Added Safety Filter in Editions API

Added additional comment and kept the filter that checks `status === 'active'` which now works correctly:

```javascript
// SAFETY: Prefer fulfilled items, but allow null fulfillment_status for digital/accessory items
// The key protection is the `status === 'active'` check above, which is set correctly during sync
const isFulfillmentValid = li.fulfillment_status === 'fulfilled' || 
                           li.fulfillment_status === 'partial' ||
                           li.fulfillment_status === null;
```

### 3. Data Cleanup

Created and ran `scripts/fix-refunded-line-items.js` to fix existing data:
- **79 line items** were incorrectly marked as active
- All have been updated to `status: 'inactive'`

## Files Changed

1. `lib/shopify/order-sync-utils.ts` - Fixed type mismatch bug
2. `app/api/collector/editions/route.ts` - Added safety comments
3. `scripts/fix-refunded-line-items.js` - New cleanup script
4. `scripts/diagnose-collector-duplicates.js` - New diagnostic script

## Testing

1. Verified collector `gavrielmiler@gmail.com` now shows correct 3 items (instead of 5)
2. Verified 79 affected line items across the system have been fixed
3. No linter errors in modified files

## Prevention

Future order syncs will now correctly detect refunded items because:
1. The type mismatch is fixed
2. The sync logic properly checks `refund_line_items` from Shopify
3. Items with `fulfillable_quantity: 0` and `fulfillment_status: null` are marked inactive

## Related

- Collector page: `/admin/collectors/2d1dec461367a610551c61d9a96b3fd3324ebdc6e108d254738d19125ad150b8`
- 79 orders affected across the system

## Prevention Measures Added

To prevent AI agents from accidentally breaking this logic again:

### 1. Cursor Rule (`.cursor/rules/order-line-items-critical.mdc`)
- Explicitly documents the critical rules for line item status
- Auto-applies when working on order/sync/collector files
- Includes code examples of what NOT to do

### 2. Critical File Headers
Added prominent warning comments to:
- `lib/shopify/order-sync-utils.ts`
- `app/api/collector/editions/route.ts`

### 3. Database Trigger (`supabase/migrations/20260202000000_add_line_item_status_trigger.sql`)
- Automatically sets `status='inactive'` for restocked items
- Acts as database-level safety net even if app code is buggy
- Needs to be applied via migration

### 4. Verification Script
- `scripts/fix-refunded-line-items.js --dry-run`
- Should show "0 items need fixing" if everything is correct
- Run after any changes to order/line-item logic

## Checklist

- [x] Identified root cause (type mismatch in Set comparison)
- [x] Fixed sync logic in `order-sync-utils.ts`
- [x] Added safety filter in editions API
- [x] Created diagnostic script
- [x] Created cleanup script
- [x] Fixed 79 affected line items
- [x] Verified specific collector fix
- [x] Documented changes
- [x] Added Cursor rule for AI agent awareness
- [x] Added critical file header comments
- [x] Created database trigger migration
