# Collector Orders Missing Data - Issue Summary & Resolution

**Date**: January 26, 2026  
**Severity**: High - Data Integrity Issue  
**Status**: ⚠️ Fix Available - Action Required

---

## Executive Summary

The collector CRM is showing **missing or incomplete order data** because the Data Enrichment Protocol (PII Bridge) has not been fully executed. Many Shopify orders have `customer_email = NULL` due to privacy redactions, and the enrichment process to populate these emails from `warehouse_orders` has not been completed.

## Impact Assessment

### Affected Areas
- ❌ Collector profiles showing 0 orders when they have purchases
- ❌ Order history missing from collector detail pages  
- ❌ Incorrect edition counts
- ❌ Wrong total spent calculations
- ❌ "Guest Customer" entries for fulfilled orders
- ❌ Broken collector analytics and reporting

### Data Quality Metrics (Estimated)
- **Orders with NULL email**: Unknown - requires diagnostic
- **Collectors affected**: Unknown - requires diagnostic
- **Line items unassigned**: Unknown - requires diagnostic

## Root Cause Analysis

### Primary Issue: NULL customer_email in orders table

The `collector_profile_comprehensive` view depends on `customer_email` being populated:

```sql
-- From migration 20260109000009_view_with_order_name_linkage.sql (line 9)
SELECT LOWER(customer_email) as email FROM orders 
WHERE customer_email IS NOT NULL AND customer_email != ''
```

**Result**: Orders without emails are excluded from the contact base, making them invisible to collectors.

### Secondary Issue: Missing owner_email and owner_id

The `order_line_items_v2` table needs `owner_email` and `owner_id` populated to associate line items with collectors:

```sql
-- From the view (lines 72-76)
WHERE 
  (
    oli.owner_id = u.id 
    OR LOWER(oli.owner_email) = cb.email 
    OR (oli.owner_email IS NULL AND LOWER(uo.customer_email) = cb.email)
  )
```

**Result**: Even if orders have emails, line items may not be associated correctly.

### Tertiary Issue: PII Bridge Not Executed

According to `docs/features/data-enrichment-protocol.mdc`:

> **Maintenance**: If you notice "Guest Customer" entries in the admin panel for orders that should be fulfilled, run the PII Bridge enrichment script

The enrichment process should:
1. Match orders to warehouse data by `order_name` (e.g., #1234)
2. Populate `customer_email` from `warehouse_orders.ship_email`
3. Auto-enrich future orders via trigger

**Result**: The enrichment has not been run, leaving orders orphaned.

## Technical Architecture

### Data Flow (As Designed)

```
┌─────────────────┐
│ Shopify Orders  │ ← PII often NULL due to privacy
└────────┬────────┘
         │
         │ Matched by order_name
         ↓
┌─────────────────┐
│ Warehouse Orders│ ← Contains ship_email (PII)
└────────┬────────┘
         │
         │ PII Bridge Enrichment
         ↓
┌─────────────────┐
│ orders.customer │ ← Populated email
│      _email     │
└────────┬────────┘
         │
         │ Used to build contact_base
         ↓
┌─────────────────┐
│ collector_profile│ ← Comprehensive view
│  _comprehensive │
└────────┬────────┘
         │
         │ Queried by API
         ↓
┌─────────────────┐
│  Collector CRM  │ ← Shows orders & editions
└─────────────────┘
```

### Data Flow (Current Broken State)

```
┌─────────────────┐
│ Shopify Orders  │ ← customer_email = NULL
└────────┬────────┘
         │
         │ ❌ No enrichment
         ↓
┌─────────────────┐
│ collector_profile│ ← Excludes orders with NULL email
│  _comprehensive │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Collector CRM  │ ← Shows 0 orders (incorrect)
└─────────────────┘
```

## Solution Implementation

### Phase 1: Diagnosis (5 minutes)

Run the diagnostic script to assess the damage:

```bash
# Execute in Supabase SQL Editor
cat scripts/diagnose-missing-orders.sql
```

**Expected Outputs**:
1. Count of orders missing `customer_email`
2. Count that can be enriched from warehouse
3. List of affected collectors
4. Sample orders needing enrichment
5. Trigger status check

### Phase 2: Data Enrichment (10 minutes)

Run the fix script to populate missing data:

```bash
# Execute in Supabase SQL Editor
cat scripts/fix-missing-orders.sql
```

**What This Does**:
1. ✅ Matches orders to warehouse by `order_name`
2. ✅ Matches orders to warehouse by `shopify_order_id`
3. ✅ Populates `orders.customer_email`
4. ✅ Populates `order_line_items_v2.owner_email`
5. ✅ Populates `order_line_items_v2.owner_id` (where user exists)
6. ✅ Verifies auto-enrichment trigger is active

### Phase 3: Verification (5 minutes)

1. **Check enrichment results**:
   ```sql
   SELECT COUNT(*) as enriched_count 
   FROM orders 
   WHERE customer_email IS NOT NULL;
   ```

2. **Test a specific collector** (replace email):
   ```sql
   SELECT 
     user_email,
     display_name,
     total_orders,
     total_editions,
     total_spent
   FROM collector_profile_comprehensive 
   WHERE user_email = 'customer@example.com';
   ```

3. **Verify in Admin UI**:
   - Navigate to `/admin/collectors`
   - Search for a previously affected collector
   - Confirm order count is correct
   - View their detail page
   - Verify order history displays

### Phase 4: Prevention (Ongoing)

1. **Enable Auto-Enrichment Trigger**:
   ```bash
   npx supabase migration up 20260108000006_pii_bridge_trigger
   ```

2. **Set up Monitoring**:
   - Weekly check for orders with NULL emails
   - Alert on collectors with 0 orders but warehouse activity
   - Track PII Bridge enrichment success rate

## Files Created

| File | Purpose |
|------|---------|
| `scripts/diagnose-missing-orders.sql` | Diagnostic queries to assess data quality |
| `scripts/fix-missing-orders.sql` | Fix script to populate missing data |
| `docs/MISSING_ORDERS_FIX_GUIDE.md` | Step-by-step guide for operators |
| `docs/COLLECTOR_ORDERS_ISSUE_SUMMARY.md` | This document - comprehensive overview |

## Related Documentation

- **Data Enrichment Protocol**: `docs/features/data-enrichment-protocol.mdc`
- **PII Bridge Trigger**: `supabase/migrations/20260108000006_pii_bridge_trigger.sql`
- **Collector View**: `supabase/migrations/20260109000009_view_with_order_name_linkage.sql`
- **Collector API**: `app/api/admin/collectors/[id]/activity/route.ts`
- **Collector Lib**: `lib/collectors.ts`

## Next Steps

### Immediate Actions Required

1. [ ] Run `scripts/diagnose-missing-orders.sql` in Supabase SQL Editor
2. [ ] Review diagnostic output to understand scope
3. [ ] Run `scripts/fix-missing-orders.sql` to enrich data
4. [ ] Verify enrichment in admin UI
5. [ ] Confirm auto-enrichment trigger is active

### Follow-Up Actions

1. [ ] Document specific collectors that were affected
2. [ ] Set up monitoring for future NULL emails
3. [ ] Create alerting for PII Bridge failures
4. [ ] Update team on data quality restoration
5. [ ] Schedule weekly data quality checks

## Support & Questions

If you encounter issues during the fix:

1. **Save diagnostic output** before running fix
2. **Note which collectors are still affected** after fix
3. **Check warehouse_orders table** for matching records
4. **Review order_name formatting** for matches
5. **Consult Data Enrichment Protocol** for special cases

---

## Status Updates

### 2026-01-26 - Issue Identified
- ✅ Root cause analysis complete
- ✅ Fix scripts created
- ✅ Documentation written
- ⏳ Awaiting execution of fix

### Next Update: After Fix Execution
- Document enrichment results
- List any remaining issues
- Update monitoring procedures

---

**Created By**: AI Assistant  
**Reviewed By**: Pending  
**Approved By**: Pending  
**Implementation Status**: Ready for Execution
