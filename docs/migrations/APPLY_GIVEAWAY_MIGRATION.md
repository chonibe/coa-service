# Giveaway Entries Migration - Application Instructions

## Overview
The giveaway roulette wheel feature requires a new table in Supabase to store giveaway data and results.

## Prerequisites
- Supabase project linked: `ldmppmnpgdxueebkkpid`
- Admin access to Supabase dashboard
- Service role key available

## Migration File
Location: `supabase/migrations/20260208000000_create_giveaway_entries.sql`

## How to Apply the Migration

### Option 1: Using Supabase Dashboard (Easiest)

1. **Go to Supabase Console**
   - Navigate to: https://app.supabase.com
   - Select your project: `ldmppmnpgdxueebkkpid`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy Migration SQL**
   - Open: `supabase/migrations/20260208000000_create_giveaway_entries.sql`
   - Copy the entire contents

4. **Paste and Execute**
   - Paste into the SQL editor
   - Click "Run" (or press Ctrl+Enter)
   - Wait for confirmation message

5. **Verify Success**
   - Go to "Table Editor" in left sidebar
   - Look for `giveaway_entries` table
   - Verify it has columns: id, giveaway_name, entry_data, winner_data, status, created_at, updated_at

### Option 2: Using Supabase CLI (if working)

```bash
# Link project (if not already linked)
npm run supabase:link

# Apply migration
supabase migration up --linked

# Or use Node.js script
node scripts/apply-giveaway-migration.js
```

### Option 3: Manual SQL in psql

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[password]@db.ldmppmnpgdxueebkkpid.supabase.co:5432/postgres"

# Copy-paste contents of supabase/migrations/20260208000000_create_giveaway_entries.sql
```

## What the Migration Creates

### Table: `giveaway_entries`
```
id              UUID PRIMARY KEY         - Unique giveaway record ID
giveaway_name   TEXT NOT NULL            - Name of the giveaway
entry_data      JSONB NOT NULL           - Parsed entries with tagger/tagged pairs
winner_data     JSONB NULL               - Winner information (both tagger and tagged)
status          TEXT (active/completed)  - Giveaway status
created_at      TIMESTAMP               - Creation timestamp
updated_at      TIMESTAMP               - Last update timestamp
```

### Indexes Created
- `idx_giveaway_entries_status` - For filtering by status
- `idx_giveaway_entries_created_at` - For sorting by date

### Security
- Row Level Security (RLS) enabled
- Permissive policy for all operations (authorization at application level)

### Functions
- `update_giveaway_entries_updated_at()` - Auto-updates `updated_at` on row changes
- `get_giveaway_history()` - Helper function to fetch paginated results

## Verification Steps

After applying the migration, verify everything works:

1. **Check Table Exists**
   ```sql
   SELECT * FROM giveaway_entries LIMIT 1;
   ```

2. **Check Columns**
   ```sql
   \d giveaway_entries
   ```

3. **Check Indexes**
   ```sql
   SELECT * FROM pg_indexes WHERE tablename = 'giveaway_entries';
   ```

4. **Check Policies**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'giveaway_entries';
   ```

## After Migration - Test the Feature

Once the table is created, test the giveaway feature:

1. **Navigate to**: `http://localhost:3000/giveaway`

2. **Run a test giveaway**:
   - Enter giveaway name: "Test Giveaway"
   - Paste sample comments:
     ```
     @alice @bob @charlie
     @john @jane @jack
     ```
   - Click "Parse Comments & Create Wheel"
   - Spin the wheel
   - Click "Start New Giveaway"

3. **Verify Database Storage**:
   - In Supabase dashboard, go to Table Editor
   - Click `giveaway_entries`
   - You should see your test giveaway record with:
     - giveaway_name: "Test Giveaway"
     - entry_data: JSON with parsed entries
     - winner_data: JSON with winner info
     - status: "completed"

## Troubleshooting

### "Table does not exist" Error
- Migration hasn't been applied yet
- Follow "Option 1" above to apply it manually

### "Syntax Error" in SQL
- Check that entire SQL file is copied (all 66 lines)
- Ensure you're using psql or Supabase SQL Editor (not regular SQL client)

### API Saves Fail with PGRST205
- This error means table doesn't exist in Supabase cache
- Apply migration (steps above)
- The error should clear after ~30 seconds

### Permission Denied Error
- Ensure you're using SERVICE ROLE KEY (not anon key)
- Check SUPABASE_SERVICE_ROLE_KEY is set in .env.local

## Rollback (if needed)

To remove the giveaway_entries table:

```sql
DROP TABLE IF NOT EXISTS giveaway_entries CASCADE;
```

This will delete:
- Table and all data
- Indexes
- Policies
- Trigger
- Functions

⚠️ **Warning**: This is destructive and cannot be undone

## Support

If you encounter issues:

1. Check the migration file syntax
2. Verify Supabase project is accessible
3. Ensure you have admin privileges
4. Review error message in Supabase dashboard SQL editor
5. Check `.env.local` has correct credentials

## Next Steps

After successful migration:
- ✅ Test giveaway feature in browser
- ✅ Verify data saves to database
- ✅ Run production deployment
- ✅ Monitor error logs for any issues

---

**Migration Date**: February 8, 2026
**Migration ID**: 20260208000000
**Feature**: Giveaway Roulette Wheel
