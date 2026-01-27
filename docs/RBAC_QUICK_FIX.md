# RBAC Migration - Quick Fix Guide

## Errors You Might See

### Error 1: Permission Denied
```
Error: Failed to run sql query: ERROR: 42501: permission denied for schema auth
```

### Error 2: Column Doesn't Exist
```
Error: Failed to run sql query: ERROR: 42703: column "status" does not exist
```

**Both errors are now fixed in the latest script!**

## Quick Fix (Choose One)

### Option 1: PowerShell Script (Easiest)

```powershell
cd c:\Users\choni\.cursor\coa-service
.\scripts\run-rbac-migration.ps1
```

### Option 2: Supabase Dashboard (Recommended)

1. Start Docker Desktop
2. Open PowerShell:
   ```powershell
   cd c:\Users\choni\.cursor\coa-service
   supabase start
   ```
3. Open http://localhost:54323
4. Go to SQL Editor
5. Copy/paste content from `scripts/apply-rbac-migrations-fixed.sql`
6. Click "Run"

### Option 3: Command Line

```powershell
cd c:\Users\choni\.cursor\coa-service
Get-Content scripts/apply-rbac-migrations-fixed.sql | supabase db execute
```

## What Was Fixed

### Fix 1: Schema Permissions
| Original (Broken) | Fixed Version |
|-------------------|---------------|
| `auth.has_role()` | `public.has_role()` |
| Creates in `auth` schema | Creates in `public` schema |
| Requires elevated permissions | Works with standard permissions |

### Fix 2: Missing Status Column
| Original (Broken) | Fixed Version |
|-------------------|---------------|
| `v.status = 'active'` | `true` (all vendors active) |
| References non-existent column | Sets active by default |
| Migration fails | Migration succeeds |

## Verify It Worked

Run this in Supabase SQL Editor:

```sql
-- Should show your migrated roles
SELECT role, COUNT(*) as count
FROM public.user_roles
GROUP BY role;
```

Expected output:
```
role      | count
----------|------
admin     | X
vendor    | X
collector | X
```

## Common Issues

**Docker not running?**
- Start Docker Desktop, then run `supabase start`

**Supabase not starting?**
- Check if ports 54321-54324 are available
- Run `supabase stop` then `supabase start`

**No roles migrated (count = 0)?**
- Check old tables have data: `SELECT COUNT(*) FROM admin_accounts WHERE auth_id IS NOT NULL;`
- Manually add roles if needed (see full guide)

## Next Steps

1. ✅ Verify JWT contains role claims (login and check at jwt.io)
2. ✅ Update API routes to use new middleware
3. ✅ Test all role types (admin, vendor, collector)

## Full Documentation

- **Complete Fix Guide**: `docs/RBAC_MIGRATION_FIX.md`
- **Migration Guide**: `docs/RBAC_MIGRATION_GUIDE.md`
- **Implementation Details**: `docs/RBAC_IMPLEMENTATION_SUMMARY.md`

## Files You Need

- ✅ **Fixed Migration**: `scripts/apply-rbac-migrations-fixed.sql`
- ❌ **Don't Use**: `scripts/apply-rbac-migrations.sql` (has permission issue)

## One-Line Fix Summary

The original script tried to create functions in the `auth` schema (which requires superuser), the fixed version creates everything in `public` schema (which works for everyone).
