# Apply Phase 3 & Phase 4 Combined Migration

## Overview

This document explains how to apply the combined Phase 3 and Phase 4 migrations that haven't been applied yet.

## Migration File

**File:** `supabase/migrations/20251204000009_attio_phase3_phase4_combined.sql`

This single file combines all the following migrations:
- `20251204000005_crm_additional_attribute_types.sql` (Phase 3)
- `20251204000006_crm_fuzzy_search.sql` (Phase 3)
- `20251204000007_crm_workspace_permissions.sql` (Phase 3)
- `20251204000008_crm_inbox_enhancements.sql` (Phase 4)

## What This Migration Includes

### Phase 3 Features

1. **Additional Attribute Types**
   - Validation functions for: Location, Currency, Rating, Timestamp, Interaction, Actor Reference, Personal Name
   - Display formatting functions for each type

2. **Fuzzy Search Support**
   - Enables `pg_trgm` extension for trigram similarity
   - `fuzzy_search_people()` function
   - `fuzzy_search_companies()` function
   - GIN indexes for performance

3. **Workspace Permissions System**
   - `crm_workspace_members` table
   - `crm_permission_scopes` table
   - `crm_role_permissions` table
   - `check_workspace_permission()` function
   - `get_workspace_member_role()` function
   - Default roles: owner, admin, member, viewer

### Phase 4 Features

1. **Email Threading**
   - Adds `thread_id`, `parent_message_id`, `thread_depth`, `thread_order` to `crm_messages`
   - Thread management functions
   - Automatic thread organization via triggers

2. **Tags System**
   - `crm_tags` table
   - `crm_conversation_tags` junction table
   - Tag migration function for existing tags

3. **Enrichment Data**
   - Adds `enrichment_data` JSONB column to `crm_customers`

4. **Conversation Enhancements**
   - Adds `is_starred` and `unread_count` to `crm_conversations`
   - `crm_message_reads` table for read tracking
   - Automatic unread count updates

## How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the **entire contents** of `supabase/migrations/20251204000009_attio_phase3_phase4_combined.sql`
6. Paste into the SQL Editor
7. Click **Run** (or press Cmd/Ctrl + Enter)
8. Verify success - you should see "Success. No rows returned"

### Option 2: Supabase CLI

```bash
# Make sure you're in the project root
cd /Users/chonib/coa-service

# Link your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Push the migration
supabase db push
```

### Option 3: psql (Direct Database Connection)

```bash
# Get your database connection string from Supabase Dashboard:
# Project Settings > Database > Connection String > URI

# Run the migration
psql "YOUR_DATABASE_CONNECTION_STRING" -f supabase/migrations/20251204000009_attio_phase3_phase4_combined.sql
```

## After Running the Migration

### 1. Migrate Existing Tags (Optional)

If you have existing tags stored in the `crm_conversations.tags` array, you can migrate them to the new tags system:

```sql
SELECT migrate_conversation_tags();
```

This will:
- Create tag records in `crm_tags` for each unique tag name
- Link conversations to tags via `crm_conversation_tags`

### 2. Initialize Workspace Members

If you want to set up workspace permissions, you'll need to create workspace member records for existing users:

```sql
-- Example: Add current user as owner
INSERT INTO crm_workspace_members (workspace_id, user_id, role, joined_at)
VALUES (
  gen_random_uuid(), -- Or use a specific workspace_id
  (SELECT id FROM auth.users WHERE email = 'your-email@example.com' LIMIT 1),
  'owner',
  NOW()
);
```

### 3. Verify Migration

Check that all tables and functions were created:

```sql
-- Check tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'crm_tags',
  'crm_conversation_tags',
  'crm_workspace_members',
  'crm_permission_scopes',
  'crm_role_permissions',
  'crm_message_reads'
);

-- Check functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'fuzzy_search_people',
  'fuzzy_search_companies',
  'check_workspace_permission',
  'get_workspace_member_role',
  'validate_attribute_value',
  'format_attribute_value_for_display'
);

-- Check columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'crm_messages' 
AND column_name IN ('thread_id', 'parent_message_id', 'thread_depth', 'thread_order');
```

## Notes

- The migration is **idempotent** - it uses `IF NOT EXISTS` and `CREATE OR REPLACE` so it's safe to run multiple times
- All functions are dropped and recreated to ensure consistency
- Triggers are dropped and recreated to avoid conflicts
- The migration includes proper indexes for performance
- All tables include proper foreign key constraints

## Troubleshooting

### Error: "extension pg_trgm does not exist"

If you get this error, you may need to enable the extension manually first:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

Then re-run the migration.

### Error: "relation already exists"

This is normal - the migration uses `IF NOT EXISTS` and `CREATE OR REPLACE`, so existing objects will be updated rather than causing errors.

### Error: "permission denied"

Make sure you're running the migration as a database superuser or with the appropriate permissions.

## Next Steps

After applying the migration:

1. ✅ Test fuzzy search: `/api/crm/search/fuzzy?q=test`
2. ✅ Test tags API: `/api/crm/tags`
3. ✅ Test workspace permissions: `/api/crm/members`
4. ✅ Test thread API: `/api/crm/messages/thread?conversation_id=xxx`
5. ✅ Continue with Phase 4 UI implementation

