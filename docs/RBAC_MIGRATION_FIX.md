# RBAC Migration - Permission Error Fix

## Problem

You encountered this error when trying to run the RBAC migration:

```
Error: Failed to run sql query: ERROR: 42501: permission denied for schema auth
```

## Root Cause

The original migration script (`scripts/apply-rbac-migrations.sql`) tried to create functions directly in the `auth` schema, which requires elevated privileges that regular database users don't have. Even with `SECURITY DEFINER`, you cannot create new objects in the `auth` schema without special permissions.

## Solution

A fixed migration script has been created: `scripts/apply-rbac-migrations-fixed.sql`

### Key Changes

1. **All custom functions are created in `public` schema** instead of `auth` schema
2. **RLS policies use `public.has_role()`** instead of `auth.has_role()`
3. **No permission issues** - everything runs with standard database user privileges
4. **Same functionality** - the RBAC system works identically

## How to Apply the Fix

### Option 1: Using Supabase Dashboard (Recommended)

1. **Start Supabase** (if not running):
   ```powershell
   cd c:\Users\choni\.cursor\coa-service
   supabase start
   ```

2. **Open Supabase Studio**:
   - Navigate to http://localhost:54323
   - Go to SQL Editor

3. **Run the fixed migration**:
   - Copy the contents of `scripts/apply-rbac-migrations-fixed.sql`
   - Paste into the SQL Editor
   - Click "Run"

4. **Verify success**:
   - Check the output messages
   - Should see role counts (admin, vendor, collector)
   - No errors about permissions

### Option 2: Using Supabase CLI

```powershell
cd c:\Users\choni\.cursor\coa-service

# Apply the fixed migration
Get-Content scripts/apply-rbac-migrations-fixed.sql | supabase db execute
```

### Option 3: Create Individual Migration Files (Production-Safe)

Instead of running one big script, you can apply the individual migration files:

```powershell
# 1. Create the role tables
supabase migration new rbac_unified_roles
# Copy content from supabase/migrations/20260126000000_rbac_unified_roles.sql

# 2. Create JWT hook functions
supabase migration new rbac_jwt_hook
# Copy content from supabase/migrations/20260126000001_rbac_jwt_hook.sql

# 3. Migrate existing data
supabase migration new rbac_data_migration
# Copy content from supabase/migrations/20260126000002_rbac_data_migration.sql

# 4. Update RLS policies
supabase migration new rbac_update_rls_policies
# Edit to use public.has_role() instead of auth.has_role()

# Then apply all migrations
supabase db push
```

## Verification Steps

After running the migration, verify everything worked:

### 1. Check Tables Were Created

```sql
SELECT COUNT(*) FROM public.user_roles;
SELECT COUNT(*) FROM public.role_permissions;
SELECT COUNT(*) FROM public.user_permission_overrides;
```

### 2. Check Roles Were Migrated

```sql
-- Check role distribution
SELECT role, COUNT(*) as count
FROM public.user_roles
GROUP BY role
ORDER BY role;

-- Check your own roles (replace with your email)
SELECT ur.role, ur.resource_id, ur.is_active
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE u.email = 'your-email@example.com';
```

### 3. Check Functions Were Created

```sql
-- Should return true if functions exist
SELECT 
  proname as function_name,
  pronargs as num_args
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('has_role', 'has_permission', 'jwt_vendor_id', 'custom_access_token')
ORDER BY proname;
```

### 4. Test JWT Hook

```sql
-- This function should exist and be callable
SELECT public.custom_access_token('{"user_id":"test","claims":{}}'::jsonb);
```

### 5. Test RLS Policies

Login to your app and verify:
- Admins can access admin routes
- Vendors can access vendor routes
- Collectors can access collector routes
- Users can't access routes they shouldn't have access to

## Common Issues

### Issue: Docker not running

**Error:**
```
failed to inspect container health: error during connect: in the default daemon configuration on Windows, the docker client must be run with elevated privileges
```

**Solution:**
```powershell
# Start Docker Desktop first, then:
supabase start
```

### Issue: Environment variables not set

**Error:**
```
WARN: environment variable is unset: SUPABASE_GOOGLE_CLIENT_ID
```

**Solution:**
- These warnings are OK for local development
- Add to `.env.local` for production:
  ```
  SUPABASE_GOOGLE_CLIENT_ID=your-client-id
  SUPABASE_GOOGLE_CLIENT_SECRET=your-client-secret
  ```

### Issue: Tables already exist

**Error:**
```
ERROR: relation "user_roles" already exists
```

**Solution:**
- The script uses `CREATE TABLE IF NOT EXISTS`, so this shouldn't happen
- If you need to start fresh:
  ```sql
  DROP TABLE IF EXISTS public.user_role_audit_log CASCADE;
  DROP TABLE IF EXISTS public.user_permission_overrides CASCADE;
  DROP TABLE IF EXISTS public.user_roles CASCADE;
  DROP TABLE IF EXISTS public.role_permissions CASCADE;
  ```

### Issue: No roles migrated

**Error:**
```
Total roles: 0
```

**Solution:**
- Check if old tables have data:
  ```sql
  SELECT COUNT(*) FROM admin_accounts WHERE auth_id IS NOT NULL;
  SELECT COUNT(*) FROM vendor_users WHERE auth_id IS NOT NULL;
  SELECT COUNT(*) FROM collector_profiles WHERE user_id IS NOT NULL;
  ```
- If they're empty, manually add roles:
  ```sql
  -- Add yourself as admin (replace with your user ID)
  INSERT INTO user_roles (user_id, role)
  VALUES ('your-user-id-here', 'admin');
  ```

## What Changed from Original Script

### Before (Original - Causes Permission Error)
```sql
-- Tried to create in auth schema (requires elevated permissions)
CREATE OR REPLACE FUNCTION auth.has_role(required_role text)
RETURNS boolean AS $$
  SELECT required_role = ANY(...);
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

### After (Fixed - Works with Standard Permissions)
```sql
-- Created in public schema (works for everyone)
CREATE OR REPLACE FUNCTION public.has_role(required_role text)
RETURNS boolean AS $$
  SELECT required_role = ANY(...);
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

## Next Steps After Migration

1. ✅ **Verify JWT hook is working**
   - Login to your app
   - Check the JWT token at https://jwt.io
   - Should see `user_roles`, `vendor_id`, `user_permissions` in claims

2. ✅ **Update API routes**
   - Replace `guardAdminRequest()` with `withAdmin()`
   - Replace `guardVendorRequest()` with `withVendor()`
   - See `docs/RBAC_MIGRATION_GUIDE.md` for examples

3. ✅ **Update Server Components**
   - Replace cookie-based session checks with `getUserContext()`
   - See migration guide for examples

4. ✅ **Test thoroughly**
   - Test each role type (admin, vendor, collector)
   - Verify RLS policies work correctly
   - Check that old routes still work during transition

5. ✅ **Monitor audit logs**
   ```sql
   SELECT * FROM public.user_role_audit_log
   ORDER BY performed_at DESC
   LIMIT 20;
   ```

## Support

If you continue to have issues:

1. Check Supabase logs:
   ```powershell
   supabase logs
   ```

2. Check database logs:
   ```powershell
   supabase db logs
   ```

3. Verify migration status:
   ```sql
   SELECT * FROM supabase_migrations.schema_migrations
   ORDER BY version DESC
   LIMIT 10;
   ```

## Files Reference

- **Fixed migration script**: `scripts/apply-rbac-migrations-fixed.sql`
- **Original migration script**: `scripts/apply-rbac-migrations.sql` (don't use this one)
- **Individual migrations**: `supabase/migrations/20260126*_rbac_*.sql`
- **Migration guide**: `docs/RBAC_MIGRATION_GUIDE.md`
- **Implementation summary**: `docs/RBAC_IMPLEMENTATION_SUMMARY.md`
- **Quick reference**: `docs/RBAC_QUICK_APPLY.md`
