# Collector Dashboard Data Integrity Protocol

## Version: 2.0
## Last Updated: 2026-02-01

---

## Overview

This document defines the **critical filtering and deduplication rules** that MUST be enforced across all collector-facing dashboards to ensure data integrity. These rules prevent duplicate artworks, canceled orders, and inactive line items from appearing in the collector's collection.

## Core Principles

### 1. **Active Status Required**
Only line items with `status = 'active'` should be displayed to collectors.

### 2. **Deduplication by Line Item ID**
Each `line_item_id` should appear exactly once, even if it exists across multiple orders (e.g., due to order cancellations and re-purchases).

### 3. **Product+Edition Uniqueness**
Each unique combination of `product_id + edition_number` should appear exactly once to prevent duplicate artworks.

### 4. **Order Status Validation**
Exclude orders with problematic statuses:
- `fulfillment_status`: `canceled`, `restocked`
- `financial_status`: `voided`, `refunded`

---

## Database-Level Filtering

### SQL Query Requirements

When fetching orders and line items, ALWAYS apply these filters:

```typescript
// ✅ CORRECT: Filter at database level
const { data: orders } = await supabase
  .from("orders")
  .select(`
    id,
    order_number,
    processed_at,
    fulfillment_status,
    financial_status,
    order_line_items_v2 (*)
  `)
  .not("fulfillment_status", "in", "(canceled,restocked)")
  .not("financial_status", "in", "(voided,refunded)")
```

```typescript
// ❌ WRONG: Fetching all orders without filtering
const { data: orders } = await supabase
  .from("orders")
  .select(`*, order_line_items_v2 (*)`)
```

---

## Application-Level Filtering

### Line Item Status Filtering

ALWAYS filter line items after fetching from database:

```typescript
// ✅ CORRECT: Multi-level filtering
const activeLineItems = (orders || []).flatMap(o => 
  (o.order_line_items_v2 || []).filter((li: any) => {
    // Must be explicitly active
    const isActive = li.status === 'active';
    
    // Must not be restocked or removed
    const isNotRestocked = li.restocked !== true && li.status !== 'removed';
    
    // Order must be valid (double-check)
    const orderIsValid = !['restocked', 'canceled'].includes(o.fulfillment_status) && 
                         !['refunded', 'voided'].includes(o.financial_status);
    
    return isActive && isNotRestocked && orderIsValid;
  })
);
```

```typescript
// ❌ WRONG: No filtering
const allLineItems = orders.flatMap(o => o.order_line_items_v2 || []);
```

---

## Deduplication Protocol

### Level 1: Line Item ID Deduplication

```typescript
// ✅ CORRECT: Deduplicate by line_item_id, keep most recent
const lineItemMap = new Map<string, any>();

deduplicatedOrders.forEach((order) => 
  (order.order_line_items_v2 || []).forEach((li: any) => {
    if (!lineItemMap.has(li.line_item_id)) {
      lineItemMap.set(li.line_item_id, li);
    } else {
      const existing = lineItemMap.get(li.line_item_id);
      // Keep the most recent one
      if (new Date(order.processed_at) > new Date(existing.order_processed_at)) {
        lineItemMap.set(li.line_item_id, li);
      }
    }
  })
);
```

### Level 2: Product+Edition Deduplication

```typescript
// ✅ CORRECT: Additional deduplication by product_id + edition_number
const productEditionMap = new Map<string, any>();

allLineItems.forEach(li => {
  if (li.product_id && li.edition_number) {
    const key = `${li.product_id}-${li.edition_number}`;
    
    if (!productEditionMap.has(key)) {
      productEditionMap.set(key, li);
    } else {
      const existing = productEditionMap.get(key);
      // Keep the most recent
      if (new Date(li.order_processed_at) > new Date(existing.order_processed_at)) {
        // Remove old one from lineItemMap
        lineItemMap.delete(existing.line_item_id);
        productEditionMap.set(key, li);
      } else {
        // Remove current duplicate
        lineItemMap.delete(li.line_item_id);
      }
    }
  }
});
```

---

## Frontend Display Rules

### When Rendering Line Items

```typescript
// ✅ CORRECT: Filter before grouping/displaying
const activeLineItems = (order.order_line_items_v2 || []).filter((item: any) => 
  item.status === 'active' && 
  item.restocked !== true
);

// Then group/display
const groupedItems = activeLineItems.reduce((acc, item) => {
  // grouping logic
}, {});
```

```typescript
// ❌ WRONG: Displaying all items without filtering
const groupedItems = (order.order_line_items_v2 || []).reduce((acc, item) => {
  // This includes inactive items!
}, {});
```

---

## Logging and Debugging

### Required Logging

Add comprehensive logs to track filtering:

```typescript
console.log(`📊 [Collector Dashboard] Deduplication Stats:`)
console.log(`   - Orders fetched: ${orders?.length}`)
console.log(`   - Total line items: ${totalLineItems}`)
console.log(`   - Inactive/removed filtered: ${inactiveCount}`)
console.log(`   - After line_item_id dedup: ${lineItemMap.size}`)
console.log(`   - After product+edition dedup: ${finalCount}`)
console.log(`   - Unique products: ${uniqueProductCount}`)
```

### Warning on Duplicates

```typescript
// Log any remaining duplicates for investigation
const editionCounts = new Map<string, number>();
allLineItems.forEach(li => {
  if (li.product_id && li.edition_number) {
    const key = `${li.product_id}-${li.edition_number}`;
    editionCounts.set(key, (editionCounts.get(key) || 0) + 1);
  }
});

const duplicates = Array.from(editionCounts.entries()).filter(([_, count]) => count > 1);
if (duplicates.length > 0) {
  console.log(`⚠️  WARNING: Found ${duplicates.length} duplicate product+edition combinations:`);
  duplicates.forEach(([key, count]) => {
    console.log(`   - ${key}: ${count} times`);
  });
}
```

---

## API Endpoints That MUST Implement This

### Critical Endpoints:
1. ✅ `/api/collector/editions` - Collector's owned editions
2. ✅ `/api/admin/collectors/[id]/activity` - Admin view of collector orders
3. ✅ `/api/collector/dashboard` - Collector dashboard data
4. ⚠️  Any new endpoints that fetch collector's line items

---

## Integration with Edition Numbering System

### Database Trigger Integration

The edition numbering system (`assign_edition_numbers` function) automatically:
- Sets `edition_number = NULL` for inactive items
- Excludes canceled/refunded/voided orders from edition assignment
- Resets edition numbers for restocked items

**See:** [`supabase/migrations/20260126000101_update_edition_numbering_for_reserves.sql`](../supabase/migrations/20260126000101_update_edition_numbering_for_reserves.sql)

### Enforcement Script

Use `scripts/reassign-all-editions.js` to retroactively enforce data integrity:

```bash
node scripts/reassign-all-editions.js
```

This script:
- Calls `assign_edition_numbers` for ALL products
- Resets edition numbers for inactive/canceled items
- Reassigns sequential numbers to active items
- Preserves authenticated (NFC-claimed) editions

---

## Testing Checklist

Before deploying changes to collector dashboard or order sync:

- [ ] Database query filters canceled/refunded orders
- [ ] Application filters `status !== 'active'` line items
- [ ] Line items deduplicated by `line_item_id`
- [ ] Product+edition combinations deduplicated
- [ ] Frontend filters before displaying
- [ ] Logging shows filtering stats
- [ ] Verified on staging with test collector
- [ ] No duplicates visible in UI
- [ ] No canceled/refunded orders visible

---

## Common Pitfalls

### ❌ Pitfall 1: Filtering After Display
```typescript
// BAD: Frontend receives all items
return NextResponse.json({ orders: allOrders })

// Frontend tries to filter
const active = orders.filter(o => o.status === 'active')
```

**Solution:** Filter at API level before sending to frontend.

---

### ❌ Pitfall 2: Missing Status Check
```typescript
// BAD: Only checks order status
const validOrders = orders.filter(o => 
  o.fulfillment_status !== 'canceled'
)
```

**Solution:** ALSO check line item status, not just order status.

---

### ❌ Pitfall 3: Single-Level Deduplication
```typescript
// BAD: Only deduplicates by line_item_id
const unique = new Map(items.map(i => [i.line_item_id, i]))
```

**Solution:** ALSO deduplicate by `product_id + edition_number` to catch re-purchases.

---

## File References

### Implementation Files:
- [`app/api/collector/editions/route.ts`](../app/api/collector/editions/route.ts) - ✅ Implements full protocol
- [`app/api/admin/collectors/[id]/activity/route.ts`](../app/api/admin/collectors/[id]/activity/route.ts) - ✅ Implements full protocol
- [`app/admin/collectors/[id]/page.tsx`](../app/admin/collectors/[id]/page.tsx) - ✅ Frontend filtering

### Related Documentation:
- [Edition Numbering System](./edition-numbering-system.md)
- [Data Enrichment Protocol](./features/data-enrichment-protocol.mdc)
- [Order Sync Utils](../lib/shopify/order-sync-utils.ts)

---

## Version History

### v2.0 (2026-02-01)
- Added product+edition deduplication
- Enhanced frontend filtering rules
- Added comprehensive logging requirements
- Added testing checklist

### v1.0 (2026-01-26)
- Initial protocol definition
- Basic filtering rules
- Database trigger integration

---

## Maintenance

**Review Frequency:** After every Shopify sync change or edition numbering update

**Owner:** Platform Engineering Team

**Last Audit:** 2026-02-01
