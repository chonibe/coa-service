-- RBAC System: Data Migration
-- Migrates existing role data from admin_accounts, vendor_users, and collector_profiles
-- to the unified user_roles table
-- Date: 2026-01-26

BEGIN;

-- ============================================
-- 1. Migrate Admins from admin_accounts
-- ============================================

INSERT INTO public.user_roles (user_id, role, is_active, metadata, granted_at)
SELECT 
  aa.auth_id,
  'admin'::text,
  true,
  jsonb_build_object(
    'source', 'admin_accounts',
    'original_email', aa.email,
    'migrated_at', now()
  ),
  COALESCE(aa.created_at, now())
FROM public.admin_accounts aa
WHERE aa.auth_id IS NOT NULL
  AND NOT EXISTS (
    -- Don't create duplicates if already exists
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = aa.auth_id AND ur.role = 'admin'
  );

-- Log migration
DO $$
DECLARE
  admin_count integer;
BEGIN
  SELECT COUNT(*) INTO admin_count
  FROM public.user_roles
  WHERE role = 'admin' AND metadata->>'source' = 'admin_accounts';
  
  RAISE NOTICE 'Migrated % admin roles from admin_accounts', admin_count;
END $$;

-- ============================================
-- 2. Migrate Vendors from vendor_users
-- ============================================

INSERT INTO public.user_roles (user_id, role, resource_id, is_active, metadata, granted_at)
SELECT 
  vu.auth_id,
  'vendor'::text,
  vu.vendor_id,
  true,
  jsonb_build_object(
    'source', 'vendor_users',
    'original_email', vu.email,
    'vendor_name', v.vendor_name,
    'migrated_at', now()
  ),
  COALESCE(vu.created_at, now())
FROM public.vendor_users vu
JOIN public.vendors v ON v.id = vu.vendor_id
WHERE vu.auth_id IS NOT NULL
  AND NOT EXISTS (
    -- Don't create duplicates if already exists
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = vu.auth_id AND ur.role = 'vendor'
  );

-- Log migration
DO $$
DECLARE
  vendor_count integer;
BEGIN
  SELECT COUNT(*) INTO vendor_count
  FROM public.user_roles
  WHERE role = 'vendor' AND metadata->>'source' = 'vendor_users';
  
  RAISE NOTICE 'Migrated % vendor roles from vendor_users', vendor_count;
END $$;

-- ============================================
-- 3. Migrate Collectors from collector_profiles
-- ============================================

INSERT INTO public.user_roles (user_id, role, is_active, metadata, granted_at)
SELECT 
  cp.user_id,
  'collector'::text,
  true,
  jsonb_build_object(
    'source', 'collector_profiles',
    'original_email', cp.email,
    'first_name', cp.first_name,
    'last_name', cp.last_name,
    'is_kickstarter_backer', cp.is_kickstarter_backer,
    'migrated_at', now()
  ),
  COALESCE(cp.created_at, now())
FROM public.collector_profiles cp
WHERE cp.user_id IS NOT NULL
  AND NOT EXISTS (
    -- Don't create duplicates if already exists
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = cp.user_id AND ur.role = 'collector'
  );

-- Log migration
DO $$
DECLARE
  collector_count integer;
BEGIN
  SELECT COUNT(*) INTO collector_count
  FROM public.user_roles
  WHERE role = 'collector' AND metadata->>'source' = 'collector_profiles';
  
  RAISE NOTICE 'Migrated % collector roles from collector_profiles', collector_count;
END $$;

-- ============================================
-- 4. Migrate Collectors from orders (users who purchased but have no profile)
-- ============================================

-- Find users who have orders but no collector_profiles entry
INSERT INTO public.user_roles (user_id, role, is_active, metadata, granted_at)
SELECT DISTINCT
  o.customer_id::uuid,
  'collector'::text,
  true,
  jsonb_build_object(
    'source', 'orders',
    'customer_email', o.customer_email,
    'migrated_at', now(),
    'note', 'Collector role inferred from order history'
  ),
  MIN(o.created_at)
FROM public.orders o
WHERE o.customer_id IS NOT NULL
  AND o.customer_id != ''
  -- Only create if they don't already have a collector role
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = o.customer_id::uuid 
      AND ur.role = 'collector'
  )
  -- And if customer_id looks like a valid UUID
  AND o.customer_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
GROUP BY o.customer_id, o.customer_email;

-- Log migration
DO $$
DECLARE
  order_collector_count integer;
BEGIN
  SELECT COUNT(*) INTO order_collector_count
  FROM public.user_roles
  WHERE role = 'collector' AND metadata->>'source' = 'orders';
  
  RAISE NOTICE 'Migrated % collector roles from orders table', order_collector_count;
END $$;

-- ============================================
-- 5. Handle users with vendor.auth_id (legacy)
-- ============================================

-- Migrate vendors that have auth_id directly on vendors table but not in vendor_users
INSERT INTO public.user_roles (user_id, role, resource_id, is_active, metadata, granted_at)
SELECT 
  v.auth_id,
  'vendor'::text,
  v.id,
  CASE 
    WHEN v.status = 'active' THEN true
    ELSE false
  END,
  jsonb_build_object(
    'source', 'vendors_legacy_auth_id',
    'vendor_name', v.vendor_name,
    'vendor_status', v.status,
    'migrated_at', now()
  ),
  COALESCE(v.created_at, now())
FROM public.vendors v
WHERE v.auth_id IS NOT NULL
  AND NOT EXISTS (
    -- Don't create if already exists from vendor_users
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = v.auth_id AND ur.role = 'vendor'
  );

-- Log migration
DO $$
DECLARE
  legacy_vendor_count integer;
BEGIN
  SELECT COUNT(*) INTO legacy_vendor_count
  FROM public.user_roles
  WHERE role = 'vendor' AND metadata->>'source' = 'vendors_legacy_auth_id';
  
  RAISE NOTICE 'Migrated % legacy vendor roles from vendors.auth_id', legacy_vendor_count;
END $$;

-- ============================================
-- 6. Final Migration Summary
-- ============================================

DO $$
DECLARE
  total_roles integer;
  admin_roles integer;
  vendor_roles integer;
  collector_roles integer;
  multi_role_users integer;
BEGIN
  -- Count total roles
  SELECT COUNT(*) INTO total_roles FROM public.user_roles;
  SELECT COUNT(*) INTO admin_roles FROM public.user_roles WHERE role = 'admin';
  SELECT COUNT(*) INTO vendor_roles FROM public.user_roles WHERE role = 'vendor';
  SELECT COUNT(*) INTO collector_roles FROM public.user_roles WHERE role = 'collector';
  
  -- Count users with multiple roles
  SELECT COUNT(*) INTO multi_role_users
  FROM (
    SELECT user_id
    FROM public.user_roles
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) sub;
  
  RAISE NOTICE '================================';
  RAISE NOTICE 'RBAC Migration Complete';
  RAISE NOTICE '================================';
  RAISE NOTICE 'Total roles created: %', total_roles;
  RAISE NOTICE 'Admin roles: %', admin_roles;
  RAISE NOTICE 'Vendor roles: %', vendor_roles;
  RAISE NOTICE 'Collector roles: %', collector_roles;
  RAISE NOTICE 'Users with multiple roles: %', multi_role_users;
  RAISE NOTICE '================================';
END $$;

-- ============================================
-- 7. Create index for migration audit
-- ============================================

-- Add index for querying migrated data by source
CREATE INDEX IF NOT EXISTS idx_user_roles_migration_source 
  ON public.user_roles ((metadata->>'source'));

COMMENT ON INDEX idx_user_roles_migration_source IS 
  'Index for querying user_roles by migration source (admin_accounts, vendor_users, collector_profiles, orders)';

COMMIT;
