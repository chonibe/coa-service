# RBAC Migration - Status Column Fix

## Issue

After fixing the permission error, a new error appeared:

```
Error: Failed to run sql query: ERROR: 42703: column "status" does not exist
```

## Root Cause

The migration script was trying to check a `status` column on the `vendors` table that doesn't exist:

```sql
-- ❌ BROKEN CODE (line 452)
CASE WHEN v.status = 'active' THEN true ELSE false END
```

The `vendors` table schema doesn't include a `status` column.

## Fix Applied

Updated the migration script to set all vendors as active by default:

```sql
-- ✅ FIXED CODE
true,  -- All vendors are active by default
```

### Changes Made

**File:** `scripts/apply-rbac-migrations-fixed.sql`

**Before (lines 447-458):**
```sql
INSERT INTO public.user_roles (user_id, role, resource_id, is_active, metadata, granted_at)
SELECT 
  v.auth_id,
  'vendor'::text,
  v.id,
  CASE WHEN v.status = 'active' THEN true ELSE false END,  -- ❌ Column doesn't exist
  jsonb_build_object('source', 'vendors_legacy_auth_id', 'vendor_name', v.vendor_name, 'vendor_status', v.status, 'migrated_at', now()),
  COALESCE(v.created_at, now())
FROM public.vendors v
WHERE v.auth_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = v.auth_id AND ur.role = 'vendor')
ON CONFLICT (user_id, role) DO NOTHING;
```

**After (lines 447-458):**
```sql
INSERT INTO public.user_roles (user_id, role, resource_id, is_active, metadata, granted_at)
SELECT 
  v.auth_id,
  'vendor'::text,
  v.id,
  true,  -- ✅ All vendors are active by default
  jsonb_build_object('source', 'vendors_legacy_auth_id', 'vendor_name', v.vendor_name, 'migrated_at', now()),
  COALESCE(v.created_at, now())
FROM public.vendors v
WHERE v.auth_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = v.auth_id AND ur.role = 'vendor')
ON CONFLICT (user_id, role) DO NOTHING;
```

## Vendors Table Schema

The actual `vendors` table structure (from migration `20250511190312_remote_schema.sql`):

```sql
CREATE TABLE IF NOT EXISTS "public"."vendors" (
    "id" integer NOT NULL,
    "vendor_name" text NOT NULL,
    "instagram_url" text,
    "notes" text,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "paypal_email" text,
    "payout_method" character varying(50) DEFAULT 'paypal'::character varying,
    "password_hash" text,
    "tax_id" text,
    "tax_country" text,
    "is_company" boolean DEFAULT false
    -- ❌ NO status column
);
```

## Impact

- **All vendors will be migrated as active** (`is_active = true`)
- **You can manually deactivate vendors later** if needed:
  ```sql
  UPDATE user_roles
  SET is_active = false
  WHERE role = 'vendor' AND user_id = 'vendor-user-id-here';
  ```
- **No data loss** - all vendors will still be migrated
- **Safe assumption** - if a vendor exists in the database, they should be active

## How to Apply

The fix is already applied to `scripts/apply-rbac-migrations-fixed.sql`. Simply run the migration again:

### Option 1: PowerShell Script
```powershell
cd c:\Users\choni\.cursor\coa-service
.\scripts\run-rbac-migration.ps1
```

### Option 2: Supabase Dashboard
1. Open http://localhost:54323
2. Go to SQL Editor
3. Copy contents of `scripts/apply-rbac-migrations-fixed.sql`
4. Run the script

### Option 3: CLI
```powershell
cd c:\Users\choni\.cursor\coa-service
Get-Content scripts/apply-rbac-migrations-fixed.sql | supabase db execute
```

## Verification

After running the migration, verify vendors were migrated:

```sql
-- Check vendor roles
SELECT 
  ur.user_id,
  ur.role,
  ur.resource_id as vendor_id,
  ur.is_active,
  ur.metadata->>'vendor_name' as vendor_name,
  ur.granted_at
FROM public.user_roles ur
WHERE ur.role = 'vendor'
ORDER BY ur.granted_at DESC;
```

Expected result: All vendors with `is_active = true`

## Managing Vendor Status

If you need to deactivate a vendor later:

```sql
-- Deactivate vendor
UPDATE public.user_roles
SET is_active = false
WHERE role = 'vendor' 
  AND resource_id = <vendor_id>;

-- Or by user ID
UPDATE public.user_roles
SET is_active = false
WHERE role = 'vendor' 
  AND user_id = '<user-uuid-here>';
```

To reactivate:

```sql
UPDATE public.user_roles
SET is_active = true
WHERE role = 'vendor' 
  AND resource_id = <vendor_id>;
```

## Alternative: Add Status Column to Vendors Table

If you want to track vendor status, you can add a status column to the vendors table later:

```sql
-- Add status column to vendors table
ALTER TABLE public.vendors
ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'));

-- Create index for performance
CREATE INDEX idx_vendors_status ON public.vendors(status);

-- Update existing RLS policies if needed
```

Then you can modify the migration to use this column.

## Summary

✅ **Fixed:** Removed non-existent `status` column reference  
✅ **Behavior:** All vendors migrate as active  
✅ **Safe:** Can manually adjust status after migration  
✅ **Ready:** Run the migration script again

## Related Issues

- Original issue: Permission denied for schema auth (FIXED)
- This issue: Column "status" does not exist (FIXED)

## Files Updated

- ✅ `scripts/apply-rbac-migrations-fixed.sql` - Lines 447-458 updated

---

**Status:** ✅ Fixed and ready to deploy  
**Last Updated:** 2026-01-26
