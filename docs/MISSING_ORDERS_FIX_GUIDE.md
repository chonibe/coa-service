# Missing Orders in Collector CRM - Fix Guide

## Problem Summary

Collectors are showing **missing or incomplete order data** in the admin CRM because many orders have `customer_email = NULL` due to Shopify privacy redactions. This breaks the Data Enrichment Protocol (PII Bridge) that should populate these emails from the `warehouse_orders` table.

## Root Cause

1. **Orders with NULL `customer_email`** are excluded from the `collector_profile_comprehensive` view
2. **The PII Bridge enrichment script** has not been run or is incomplete
3. **Missing `owner_email` and `owner_id`** in `order_line_items_v2` table prevents line items from being associated with collectors

## Impact

- Collectors show "0 orders" when they actually have orders
- Order history is incomplete in collector detail pages
- Edition counts are incorrect
- Total spent calculations are wrong
- "Guest Customer" entries appear for fulfilled orders

## Solution Steps

### Step 1: Diagnose the Issue

Run the diagnostic script to understand the scope:

```bash
# In Supabase Dashboard SQL Editor:
# Paste and run: scripts/diagnose-missing-orders.sql
```

Or using Supabase CLI:

```bash
npx supabase db execute --file scripts/diagnose-missing-orders.sql --local
```

This will show:
- How many orders are missing `customer_email`
- How many CAN be enriched from warehouse data
- Which collectors are affected
- Sample orders that need fixing

### Step 2: Run the Fix Script

**IMPORTANT**: Review the diagnostic results first before running the fix.

```bash
# In Supabase Dashboard SQL Editor:
# Paste and run: scripts/fix-missing-orders.sql
```

Or using Supabase CLI:

```bash
npx supabase db execute --file scripts/fix-missing-orders.sql --local
```

This script will:
1. ✅ Match orders to warehouse data by `order_name`
2. ✅ Match orders to warehouse data by `shopify_order_id`
3. ✅ Populate `customer_email` in orders table
4. ✅ Populate `owner_email` in order_line_items_v2
5. ✅ Populate `owner_id` where auth.users exist
6. ✅ Verify the auto-enrichment trigger is active

### Step 3: Verify the Fix

After running the fix script, check the results:

1. **Check total enriched orders**:
   ```sql
   SELECT COUNT(*) FROM orders WHERE customer_email IS NOT NULL;
   ```

2. **Check a specific collector** (replace with actual email):
   ```sql
   SELECT * FROM collector_profile_comprehensive 
   WHERE user_email = 'customer@example.com';
   ```

3. **Verify in the Admin UI**:
   - Navigate to `/admin/collectors`
   - Search for a collector who was previously showing 0 orders
   - Verify their order count is now correct
   - Click into their profile and verify order history appears

### Step 4: Enable Auto-Enrichment

Ensure the PII Bridge trigger is active for future orders:

```sql
-- Check trigger status
SELECT 
  t.tgname,
  t.tgenabled,
  pg_get_triggerdef(t.oid)
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'warehouse_orders'
  AND t.tgname = 'tr_warehouse_enrichment';
```

If the trigger is missing, run:

```bash
npx supabase migration up 20260108000006_pii_bridge_trigger
```

## Alternative: Use the Node.js Script

You can also use the existing enrichment script:

```bash
node scripts/run-pii-bridge-enrichment.js
```

**Note**: This script only updates `orders.customer_email`. You'll still need to run the SQL fix script to populate `order_line_items_v2.owner_email` and `owner_id`.

## Monitoring

After the fix, monitor for:

1. **Remaining NULL emails**:
   ```sql
   SELECT COUNT(*) FROM orders WHERE customer_email IS NULL;
   ```

2. **Orders without warehouse matches** (may be legitimate guest orders):
   ```sql
   SELECT order_name, order_number, processed_at 
   FROM orders 
   WHERE customer_email IS NULL 
   ORDER BY processed_at DESC 
   LIMIT 20;
   ```

3. **Collectors with 0 orders** (should be minimal after fix):
   ```sql
   SELECT COUNT(*) FROM collector_profile_comprehensive WHERE total_orders = 0;
   ```

## Prevention

To prevent this issue in the future:

1. ✅ **Auto-enrichment trigger is active** - New warehouse orders automatically populate order emails
2. ✅ **Regular monitoring** - Set up alerts for orders with NULL emails
3. ✅ **Documentation** - Follow the Data Enrichment Protocol in `docs/features/data-enrichment-protocol.mdc`

## Troubleshooting

### Issue: Orders still show NULL after running fix

**Possible causes**:
- No matching warehouse_orders record exists
- Warehouse order has NULL or invalid `ship_email`
- Order name mismatch between systems

**Solution**: 
- Manually add warehouse records for these orders
- Or manually update `customer_email` if you have the data from another source

### Issue: Line items not showing for collector

**Possible causes**:
- `owner_email` or `owner_id` not populated in `order_line_items_v2`
- Order deduplication logic filtering out the order

**Solution**:
- Run Step 4 and 5 of the fix script again
- Check if the order is being deduplicated (has a WH- prefix or #9 prefix)

### Issue: Collector count doesn't match after fix

**Possible causes**:
- View cache needs refresh
- Deduplication logic hiding duplicate orders

**Solution**:
```sql
REFRESH MATERIALIZED VIEW IF EXISTS collector_profile_comprehensive;
-- Or just query the view again, as it's not materialized
SELECT * FROM collector_profile_comprehensive WHERE user_email = 'customer@example.com';
```

## Related Documentation

- [Data Enrichment Protocol](./features/data-enrichment-protocol.mdc)
- [PII Bridge Migration](../supabase/migrations/20260108000006_pii_bridge_trigger.sql)
- [Collector Profile View](../supabase/migrations/20260109000009_view_with_order_name_linkage.sql)

## Support

If issues persist after following this guide:

1. Run the diagnostic script and save the output
2. Check the collector profile in question
3. Document which orders are missing and their characteristics
4. Review the Data Enrichment Protocol for special cases

---

**Last Updated**: 2026-01-26  
**Version**: 1.0.0  
**Status**: Active Fix Required
