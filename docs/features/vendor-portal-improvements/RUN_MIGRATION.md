# Running the Vendor Messages Migration

This guide explains how to run the database migration for the vendor messages and notifications system.

## Migration File
`supabase/migrations/20251118000000_vendor_messages.sql`

## Option 1: Supabase Dashboard (Recommended - Easiest)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/20251118000000_vendor_messages.sql`
5. Paste it into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Verify the migration completed successfully

## Option 2: Supabase CLI

If you have the Supabase CLI installed and your project is linked:

```bash
# Link your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push
```

To get your project ref:
- Go to Supabase Dashboard > Project Settings > General
- Copy the "Reference ID"

## Option 3: psql (Direct Database Connection)

If you have `psql` installed and your database connection string:

```bash
# Get your database connection string from Supabase Dashboard:
# Project Settings > Database > Connection String > URI

# Run the migration
psql "YOUR_DATABASE_CONNECTION_STRING" -f supabase/migrations/20251118000000_vendor_messages.sql
```

## What This Migration Creates

1. **vendor_messages** table
   - Thread-based messaging system
   - Supports vendor, customer, admin, and system senders
   - Read/unread tracking

2. **vendor_notifications** table
   - System notifications (orders, payouts, product changes, etc.)
   - Read/unread tracking
   - Links to related pages

3. **vendor_notification_preferences** table
   - Per-vendor notification preferences
   - Email and push notification toggles

4. **Indexes** for performance
5. **RLS Policies** for security
6. **Triggers** for automatic timestamp updates

## Verification

After running the migration, verify it worked by checking:

1. In Supabase Dashboard > Table Editor, you should see:
   - `vendor_messages`
   - `vendor_notifications`
   - `vendor_notification_preferences`

2. Or run this SQL query:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('vendor_messages', 'vendor_notifications', 'vendor_notification_preferences');
```

You should see all three tables listed.

## Troubleshooting

### Error: "relation already exists"
- The tables may already exist. The migration uses `CREATE TABLE IF NOT EXISTS`, so this is safe to ignore.

### Error: "permission denied"
- Make sure you're using the service role key or have admin access to the database.

### Error: "function does not exist"
- Some functions like `uuid_generate_v4()` require the `uuid-ossp` extension. The migration should handle this, but if you get this error, run:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## Next Steps

After the migration is complete:
1. The messages and notifications features will be available in the vendor portal
2. Vendors can start sending/receiving messages
3. System notifications will be stored in the database
4. All RLS policies are active for security

---

**Migration File**: `supabase/migrations/20251118000000_vendor_messages.sql`  
**Created**: 2025-11-18  
**Status**: Ready to run

