# CRM System Migration Guide

## Quick Fix: Apply the CRM Migration

The CRM tables need to be created in your Supabase database. Follow these steps:

## Option 1: Supabase Dashboard (Recommended - Easiest)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the **entire contents** of `supabase/migrations/20251202000000_crm_system.sql`
6. Paste into the SQL Editor
7. Click **Run** (or press Cmd/Ctrl + Enter)
8. Verify success - you should see "Success. No rows returned"

## Option 2: Using Supabase CLI

If you have Supabase CLI installed and your project linked:

```bash
# Make sure you're in the project root
cd /Users/chonib/coa-service

# Link your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Push the migration
supabase db push
```

## What This Migration Creates

- `crm_customers` - Stores customer information from orders
- `crm_conversations` - Groups messages by customer and platform
- `crm_messages` - Individual email/Instagram messages
- Enums for platform, status, and message direction
- Indexes for fast queries
- Triggers for automatic timestamp updates

## After Running the Migration

1. Go back to `/admin/crm/customers`
2. Click "Sync from Orders" again
3. Your customers should now sync successfully!

## Verification

After running the migration, verify the tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'crm_%';
```

You should see:
- `crm_customers`
- `crm_conversations`
- `crm_messages`

