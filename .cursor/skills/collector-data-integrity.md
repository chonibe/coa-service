# Skill: Collector Dashboard Data Integrity & Order Sync

## When to Use This Skill

Use this skill when:
- Working with collector dashboards or profile pages
- Syncing orders from Shopify
- Implementing or modifying edition assignment logic
- Dealing with line items, order status, or collector-owned artworks
- Debugging duplicate artworks or canceled orders appearing in UI
- Any API endpoint that returns collector's owned items/editions

## Quick Reference

### Critical Rules (ALWAYS Apply)

1. **Filter orders at database level:**
   - Exclude: `fulfillment_status IN ('canceled', 'restocked')`
   - Exclude: `financial_status IN ('voided', 'refunded')`

2. **Filter line items at application level:**
   - Include ONLY: `status = 'active'`
   - Exclude: `restocked = true`
   - Exclude: `status = 'removed'`

3. **Deduplicate in TWO stages:**
   - Stage 1: By `line_item_id` (keep most recent)
   - Stage 2: By `product_id + edition_number` (prevent duplicate artworks)

4. **Frontend: Filter before display**
   - Never render line items without checking `status = 'active'`

## Implementation Template

### API Endpoint (Backend)

```typescript
// STEP 1: Database Query with Filters
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

// STEP 2: Application-Level Line Item Filtering
const activeLineItems = (orders || []).flatMap(o => 
  (o.order_line_items_v2 || []).filter((li: any) => {
    const isActive = li.status === 'active';
    const isNotRestocked = li.restocked !== true && li.status !== 'removed';
    const orderIsValid = !['restocked', 'canceled'].includes(o.fulfillment_status) && 
                         !['refunded', 'voided'].includes(o.financial_status);
    return isActive && isNotRestocked && orderIsValid;
  })
);

// STEP 3: Deduplication Level 1 - By line_item_id
const lineItemMap = new Map<string, any>();
activeLineItems.forEach(li => {
  if (!lineItemMap.has(li.line_item_id)) {
    lineItemMap.set(li.line_item_id, li);
  } else {
    const existing = lineItemMap.get(li.line_item_id);
    if (new Date(li.order_processed_at) > new Date(existing.order_processed_at)) {
      lineItemMap.set(li.line_item_id, li);
    }
  }
});

// STEP 4: Deduplication Level 2 - By product_id + edition_number
const productEditionMap = new Map<string, any>();
Array.from(lineItemMap.values()).forEach(li => {
  if (li.product_id && li.edition_number) {
    const key = `${li.product_id}-${li.edition_number}`;
    if (!productEditionMap.has(key)) {
      productEditionMap.set(key, li);
    } else {
      const existing = productEditionMap.get(key);
      if (new Date(li.order_processed_at) > new Date(existing.order_processed_at)) {
        lineItemMap.delete(existing.line_item_id);
        productEditionMap.set(key, li);
      } else {
        lineItemMap.delete(li.line_item_id);
      }
    }
  }
});

const finalLineItems = Array.from(lineItemMap.values());

// STEP 5: Add Logging
console.log(`📊 [API] Deduplication Stats:`)
console.log(`   - Orders fetched: ${orders?.length}`)
console.log(`   - Active line items: ${activeLineItems.length}`)
console.log(`   - After line_item_id dedup: ${lineItemMap.size}`)
console.log(`   - Final unique items: ${finalLineItems.length}`)
```

### Frontend Component

```typescript
// ALWAYS filter line items before rendering
const activeLineItems = (order.order_line_items_v2 || []).filter((item: any) => 
  item.status === 'active' && 
  item.restocked !== true
);

// Then display
return (
  <div>
    {activeLineItems.map(item => (
      <LineItemCard key={item.id} item={item} />
    ))}
  </div>
);
```

## Testing Checklist

After implementing or modifying:

- [ ] Run `node scripts/reassign-all-editions.js` to clean database
- [ ] Test with collector who has canceled orders
- [ ] Verify no duplicates in UI
- [ ] Check browser console for deduplication logs
- [ ] Verify `Active line items` count is correct
- [ ] Ensure no `removed` or `restocked` items display

## Common Scenarios

### Scenario 1: New API Endpoint for Collector Data

**Task:** Create `/api/collector/my-artworks`

**Steps:**
1. Read this skill
2. Copy implementation template
3. Apply all 5 filtering/deduplication steps
4. Add logging
5. Test with collector who has canceled orders
6. Deploy

### Scenario 2: Shopify Order Sync Issues

**Task:** Duplicate artworks appearing after order sync

**Diagnosis:**
1. Check if `assign_edition_numbers` trigger is firing
2. Run `node scripts/reassign-all-editions.js`
3. Verify line item `status` is being set correctly in sync
4. Check if API endpoints are filtering properly

**Fix:**
- Ensure `lib/shopify/order-sync-utils.ts` sets `status = 'inactive'` for canceled items
- Verify database triggers are active
- Apply frontend filtering

### Scenario 3: Edition Numbering Conflicts

**Task:** Same edition number appearing twice

**Solution:**
1. Run database cleanup: `node scripts/reassign-all-editions.js`
2. Verify product+edition deduplication in API
3. Check database trigger: `assign_edition_numbers` function
4. Ensure frontend groups by `product_id + edition_number`

## File References

### Must Read Before Changes:
- **Documentation:** `docs/COLLECTOR_DASHBOARD_DATA_INTEGRITY.md`
- **Edition System:** `docs/edition-numbering-system.md`
- **Data Protocol:** `docs/features/data-enrichment-protocol.mdc`

### Implementation Examples:
- **Collector Editions API:** `app/api/collector/editions/route.ts`
- **Admin Activity API:** `app/api/admin/collectors/[id]/activity/route.ts`
- **Frontend Page:** `app/admin/collectors/[id]/page.tsx`

### Utilities:
- **Order Sync:** `lib/shopify/order-sync-utils.ts`
- **Cleanup Script:** `scripts/reassign-all-editions.js`
- **DB Migration:** `supabase/migrations/20260126000101_update_edition_numbering_for_reserves.sql`

## Red Flags (Stop and Review)

🚨 If you see:
- Duplicates in collector dashboard
- Canceled orders showing up
- `status = 'inactive'` items in UI
- Edition numbers duplicated
- Line items with `restocked = true` visible

**Action:** 
1. Stop development
2. Read `docs/COLLECTOR_DASHBOARD_DATA_INTEGRITY.md`
3. Apply this skill's implementation template
4. Run cleanup script
5. Add proper logging
6. Test thoroughly

## Quick Fixes

### Fix 1: Frontend Showing All Items
```typescript
// BEFORE (BAD)
{order.order_line_items_v2.map(item => <Item {...item} />)}

// AFTER (GOOD)
{order.order_line_items_v2
  .filter(item => item.status === 'active' && item.restocked !== true)
  .map(item => <Item {...item} />)}
```

### Fix 2: API Returning Duplicates
```typescript
// Add after fetching line items:
const lineItemMap = new Map();
lineItems.forEach(li => {
  if (!lineItemMap.has(li.line_item_id)) {
    lineItemMap.set(li.line_item_id, li);
  }
});
const uniqueItems = Array.from(lineItemMap.values());
```

### Fix 3: Database Has Dirty Data
```bash
# Run cleanup script
node scripts/reassign-all-editions.js

# Verify in Supabase
SELECT product_id, edition_number, status, COUNT(*) 
FROM order_line_items_v2 
WHERE status = 'active' 
GROUP BY product_id, edition_number, status 
HAVING COUNT(*) > 1;
```

## Success Criteria

✅ Implementation is correct when:
- Zero duplicates in UI
- No canceled/refunded orders visible
- Console logs show proper filtering stats
- Edition numbers are unique per product
- Line item count matches `status = 'active'` count
- All tests pass

## Version

**Version:** 1.0  
**Last Updated:** 2026-02-01  
**Applies To:** All collector-facing dashboards and order sync operations
