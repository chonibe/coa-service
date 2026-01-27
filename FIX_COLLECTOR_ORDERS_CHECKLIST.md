# Fix Collector Orders - Quick Checklist

## 🚨 Issue
Collectors are showing missing orders in the CRM because `customer_email` is NULL in many orders.

## ✅ Quick Fix (20 minutes total)

### Step 1: Diagnose (5 min)
```bash
# Open Supabase Dashboard → SQL Editor
# Copy/paste and run: scripts/diagnose-missing-orders.sql
```

**What to look for**:
- [ ] How many orders have NULL email?
- [ ] How many can be enriched from warehouse?
- [ ] Which collectors are affected?

### Step 2: Run Fix (10 min)
```bash
# In Supabase Dashboard → SQL Editor
# Copy/paste and run: scripts/fix-missing-orders.sql
```

**What it does**:
- [x] Populates `orders.customer_email` from warehouse
- [x] Populates `order_line_items_v2.owner_email`
- [x] Populates `order_line_items_v2.owner_id`
- [x] Verifies auto-enrichment trigger

### Step 3: Verify (5 min)
```bash
# Test in Admin UI
1. Go to: http://localhost:3000/admin/collectors
2. Search for a collector who had 0 orders
3. Verify their order count is now correct
4. Click into their profile
5. Verify order history shows up
```

**SQL Verification**:
```sql
-- Check enrichment results
SELECT COUNT(*) as enriched_orders 
FROM orders 
WHERE customer_email IS NOT NULL;

-- Check a specific collector (replace email)
SELECT 
  user_email,
  display_name,
  total_orders,
  total_editions
FROM collector_profile_comprehensive 
WHERE user_email = 'customer@example.com';
```

## 📋 Success Criteria

- [ ] Diagnostic script shows affected orders
- [ ] Fix script runs without errors
- [ ] Orders now have `customer_email` populated
- [ ] Line items have `owner_email` populated
- [ ] Collector profiles show correct order counts
- [ ] Order history appears in collector detail pages
- [ ] Auto-enrichment trigger is active

## 🔍 Files to Use

| File | Purpose |
|------|---------|
| `scripts/diagnose-missing-orders.sql` | Find the problem |
| `scripts/fix-missing-orders.sql` | Fix the problem |
| `docs/MISSING_ORDERS_FIX_GUIDE.md` | Detailed guide |
| `docs/COLLECTOR_ORDERS_ISSUE_SUMMARY.md` | Full analysis |

## ⚠️ Important Notes

1. **Backup recommended**: The fix script includes commented backup code
2. **Review first**: Check diagnostic output before running fix
3. **Trigger required**: Ensure PII Bridge trigger is active for future orders
4. **Case sensitivity**: All email comparisons use LOWER()

## 🆘 If Something Goes Wrong

1. Check that warehouse_orders table has matching records
2. Verify order_name format matches between tables
3. Confirm email addresses are valid format
4. Review Data Enrichment Protocol: `docs/features/data-enrichment-protocol.mdc`

## 📊 Monitoring (After Fix)

Set up weekly checks:

```sql
-- Check for new orders with NULL email
SELECT COUNT(*) FROM orders WHERE customer_email IS NULL;

-- Check for collectors with 0 orders
SELECT COUNT(*) FROM collector_profile_comprehensive WHERE total_orders = 0;
```

---

**Last Updated**: 2026-01-26  
**Estimated Time**: 20 minutes  
**Difficulty**: Easy (just run SQL scripts)
