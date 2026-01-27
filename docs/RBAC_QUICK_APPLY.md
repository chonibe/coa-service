# Quick Apply RBAC Migrations

Due to migration history conflicts, use this method to apply RBAC migrations directly.

## Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard → SQL Editor
2. Copy the entire contents of `scripts/apply-rbac-migrations.sql`
3. Paste and run in the SQL Editor
4. Verify success by checking the NOTICE messages

## Option 2: Fix Migration History First, Then Apply

If you want to use the CLI:

1. **First, run the cleanup script in Dashboard:**
   - Copy `scripts/fix-migration-history.sql`
   - Run in Supabase Dashboard SQL Editor

2. **Then apply RBAC migrations via CLI:**
   ```bash
   supabase migration up --linked --include-all
   ```

## Verification

After applying, verify the system:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_roles', 'role_permissions', 'user_permission_overrides');

-- Check roles were migrated
SELECT role, COUNT(*) FROM user_roles GROUP BY role;

-- Check JWT hook function exists
SELECT proname FROM pg_proc WHERE proname = 'custom_access_token';

-- Check helper functions exist
SELECT proname FROM pg_proc WHERE proname IN ('has_role', 'jwt_vendor_id', 'has_permission');
```

## Next Steps

1. ✅ Verify JWT hook is enabled in `supabase/config.toml`
2. ✅ Test login - decode JWT at jwt.io to see `user_roles` claim
3. ✅ Update API routes to use `withAuth` middleware
4. ✅ Test admin UI at `/admin/users`
