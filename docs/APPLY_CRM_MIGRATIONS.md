# Apply CRM Database Migrations

## Quick Fix: Apply Missing Columns

The `crm_customers` table is missing the new columns. Apply this migration to add them:

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the **entire contents** of `supabase/migrations/20251202000002_add_missing_crm_columns.sql`
6. Paste into the SQL Editor
7. Click **Run** (or press Cmd/Ctrl + Enter)
8. Verify success - you should see "Success. No rows returned"

### Option 2: Apply All Migrations in Order

If you haven't applied any CRM migrations yet, apply them in this order:

1. **First**: `supabase/migrations/20251202000000_crm_system.sql`
   - Creates the base CRM tables and enums
   
2. **Second**: `supabase/migrations/20251202000001_crm_customer_order_history.sql`
   - Creates the order history tracking table
   
3. **Third**: `supabase/migrations/20251202000002_add_missing_crm_columns.sql`
   - Adds missing columns to existing table (safe to run even if columns exist)

### What This Migration Adds

- `chinadivision_order_ids[]` - Array of platform order IDs
- `shopify_order_ids[]` - Array of Shopify order IDs  
- `total_orders` - Count of all orders
- `first_order_date` / `last_order_date` - Order timeline
- `total_spent` - Customer lifetime value
- `phone` - Contact phone number
- `address` (JSONB) - Full address data
- `tags[]` - Custom tags for customers
- `metadata` (JSONB) - Additional enrichment data

### After Running the Migration

1. Go back to `/admin/crm/customers`
2. Click "Sync from Orders" again
3. The sync should now work without errors!

## Verification

After running the migration, verify the columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'crm_customers'
ORDER BY ordinal_position;
```

You should see all the new columns listed.

