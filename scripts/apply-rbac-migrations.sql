-- RBAC System: Complete Migration Script
-- Run this script directly in Supabase Dashboard SQL Editor
-- This combines all 4 RBAC migrations into one script
-- Date: 2026-01-26

-- ============================================
-- PART 1: Unified Role Tables
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'vendor', 'collector')),
  resource_id integer,
  is_active boolean DEFAULT true,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_resource_id ON public.user_roles(resource_id) WHERE resource_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(is_active) WHERE is_active = true;

CREATE OR REPLACE FUNCTION public.update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER trigger_update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_roles_updated_at();

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('admin', 'vendor', 'collector')),
  permission text NOT NULL,
  resource_type text,
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role, permission)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_resource_type ON public.role_permissions(resource_type) WHERE resource_type IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.user_permission_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission text NOT NULL,
  granted boolean NOT NULL,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_user_permission_overrides_user_id ON public.user_permission_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permission_overrides_active ON public.user_permission_overrides(granted) WHERE granted = true;

INSERT INTO public.role_permissions (role, permission, resource_type, description) VALUES
  ('admin', 'admin:all', 'system', 'Full system access'),
  ('admin', 'vendors:manage', 'vendors', 'Manage all vendors'),
  ('admin', 'collectors:manage', 'collectors', 'Manage all collectors'),
  ('admin', 'orders:manage', 'orders', 'Manage all orders'),
  ('admin', 'products:manage', 'products', 'Manage all products'),
  ('admin', 'payouts:manage', 'payouts', 'Manage all payouts'),
  ('admin', 'users:manage', 'users', 'Manage user roles and permissions'),
  ('admin', 'reports:view', 'reports', 'View all reports and analytics'),
  ('admin', 'security:audit', 'security', 'View security audit logs'),
  ('admin', 'impersonate:vendor', 'vendors', 'Impersonate vendor accounts'),
  ('vendor', 'vendor:dashboard', 'vendors', 'Access vendor dashboard'),
  ('vendor', 'products:create', 'products', 'Create new products'),
  ('vendor', 'products:edit', 'products', 'Edit own products'),
  ('vendor', 'products:delete', 'products', 'Delete own products'),
  ('vendor', 'series:manage', 'series', 'Manage artwork series'),
  ('vendor', 'media:manage', 'media', 'Manage media library'),
  ('vendor', 'orders:view', 'orders', 'View own orders'),
  ('vendor', 'payouts:view', 'payouts', 'View own payouts'),
  ('vendor', 'payouts:request', 'payouts', 'Request instant payouts'),
  ('vendor', 'analytics:view', 'analytics', 'View own analytics'),
  ('vendor', 'store:access', 'store', 'Access vendor store'),
  ('collector', 'collector:dashboard', 'collectors', 'Access collector dashboard'),
  ('collector', 'artwork:view', 'artwork', 'View owned artwork'),
  ('collector', 'artwork:authenticate', 'artwork', 'Authenticate physical items via NFC'),
  ('collector', 'series:view', 'series', 'View series progress'),
  ('collector', 'profile:manage', 'profile', 'Manage collector profile'),
  ('collector', 'benefits:access', 'benefits', 'Access exclusive content and benefits'),
  ('collector', 'avatar:manage', 'avatar', 'Manage avatar and customization')
ON CONFLICT (role, permission) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.user_role_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL,
  action text NOT NULL CHECK (action IN ('granted', 'revoked', 'expired', 'modified')),
  resource_id integer,
  performed_by uuid REFERENCES auth.users(id),
  performed_at timestamptz DEFAULT now(),
  previous_state jsonb,
  new_state jsonb,
  reason text
);

CREATE INDEX IF NOT EXISTS idx_user_role_audit_log_user_id ON public.user_role_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_audit_log_performed_at ON public.user_role_audit_log(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_role_audit_log_performed_by ON public.user_role_audit_log(performed_by);

CREATE OR REPLACE FUNCTION public.log_user_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.user_role_audit_log (
      user_id, role, action, resource_id, performed_by, new_state
    ) VALUES (
      NEW.user_id, NEW.role, 'granted', NEW.resource_id, NEW.granted_by,
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_active = true AND NEW.is_active = false THEN
      INSERT INTO public.user_role_audit_log (
        user_id, role, action, resource_id, performed_by, previous_state, new_state
      ) VALUES (
        NEW.user_id, NEW.role, 'revoked', NEW.resource_id, NEW.granted_by,
        to_jsonb(OLD), to_jsonb(NEW)
      );
    ELSE
      INSERT INTO public.user_role_audit_log (
        user_id, role, action, resource_id, performed_by, previous_state, new_state
      ) VALUES (
        NEW.user_id, NEW.role, 'modified', NEW.resource_id, NEW.granted_by,
        to_jsonb(OLD), to_jsonb(NEW)
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.user_role_audit_log (
      user_id, role, action, resource_id, performed_by, previous_state
    ) VALUES (
      OLD.user_id, OLD.role, 'revoked', OLD.resource_id, OLD.granted_by,
      to_jsonb(OLD)
    );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_user_role_change ON public.user_roles;
CREATE TRIGGER trigger_log_user_role_change
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_user_role_change();

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permission_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
        AND ur.is_active = true
    )
  );

DROP POLICY IF EXISTS "Authenticated users can view role permissions" ON public.role_permissions;
CREATE POLICY "Authenticated users can view role permissions"
  ON public.role_permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage role permissions" ON public.role_permissions;
CREATE POLICY "Admins can manage role permissions"
  ON public.role_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
        AND ur.is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can view their own permission overrides" ON public.user_permission_overrides;
CREATE POLICY "Users can view their own permission overrides"
  ON public.user_permission_overrides FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage permission overrides" ON public.user_permission_overrides;
CREATE POLICY "Admins can manage permission overrides"
  ON public.user_permission_overrides FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
        AND ur.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can view audit log" ON public.user_role_audit_log;
CREATE POLICY "Admins can view audit log"
  ON public.user_role_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
        AND ur.is_active = true
    )
  );

CREATE OR REPLACE FUNCTION public.get_user_roles(p_user_id uuid)
RETURNS text[] AS $$
  SELECT array_agg(role)
  FROM public.user_roles
  WHERE user_id = p_user_id
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now());
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.user_has_role(p_user_id uuid, p_role text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = p_user_id
      AND role = p_role
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id uuid)
RETURNS TABLE(permission text, source text) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT rp.permission, 'role:' || ur.role as source
  FROM public.user_roles ur
  JOIN public.role_permissions rp ON rp.role = ur.role
  WHERE ur.user_id = p_user_id
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > now())
  
  UNION
  
  SELECT upo.permission, 'override' as source
  FROM public.user_permission_overrides upo
  WHERE upo.user_id = p_user_id
    AND upo.granted = true
    AND (upo.expires_at IS NULL OR upo.expires_at > now())
  
  EXCEPT
  
  SELECT upo.permission, 'override' as source
  FROM public.user_permission_overrides upo
  WHERE upo.user_id = p_user_id
    AND upo.granted = false
    AND (upo.expires_at IS NULL OR upo.expires_at > now());
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.user_has_permission(p_user_id uuid, p_permission text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.get_user_permissions(p_user_id)
    WHERE permission = p_permission
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================
-- PART 2: JWT Hook Functions
-- ============================================

CREATE OR REPLACE FUNCTION public.custom_access_token(event jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  claims jsonb;
  user_roles_arr text[];
  user_permissions_arr text[];
  vendor_id_val integer;
BEGIN
  claims := event->'claims';
  
  SELECT 
    array_agg(role ORDER BY 
      CASE role 
        WHEN 'admin' THEN 1 
        WHEN 'vendor' THEN 2 
        WHEN 'collector' THEN 3 
      END
    ),
    MAX(resource_id)
  INTO user_roles_arr, vendor_id_val
  FROM public.user_roles
  WHERE user_id = (event->>'user_id')::uuid
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now());
  
  SELECT array_agg(DISTINCT permission ORDER BY permission)
  INTO user_permissions_arr
  FROM public.get_user_permissions((event->>'user_id')::uuid);
  
  claims := jsonb_set(claims, '{user_roles}', to_jsonb(COALESCE(user_roles_arr, '{}'::text[])));
  
  IF vendor_id_val IS NOT NULL THEN
    claims := jsonb_set(claims, '{vendor_id}', to_jsonb(vendor_id_val));
  END IF;
  
  claims := jsonb_set(claims, '{user_permissions}', to_jsonb(COALESCE(user_permissions_arr, '{}'::text[])));
  claims := jsonb_set(claims, '{rbac_version}', to_jsonb('2.0'::text));
  
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token(jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.has_role(required_role text)
RETURNS boolean AS $$
  SELECT required_role = ANY(
    COALESCE(
      (
        SELECT ARRAY(
          SELECT jsonb_array_elements_text(
            current_setting('request.jwt.claims', true)::jsonb->'user_roles'
          )
        )
      ),
      '{}'::text[]
    )
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Try to create alias in auth schema (may fail due to permissions)
DO $$
BEGIN
  EXECUTE 'CREATE OR REPLACE FUNCTION auth.has_role(required_role text) RETURNS boolean AS $func$ SELECT public.has_role(required_role) $func$ LANGUAGE sql STABLE SECURITY DEFINER';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Cannot create auth.has_role - will use public.has_role in RLS policies';
END $$;

CREATE OR REPLACE FUNCTION public.has_permission(required_permission text)
RETURNS boolean AS $$
  SELECT required_permission = ANY(
    COALESCE(
      (
        SELECT ARRAY(
          SELECT jsonb_array_elements_text(
            current_setting('request.jwt.claims', true)::jsonb->'user_permissions'
          )
        )
      ),
      '{}'::text[]
    )
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Try to create alias in auth schema
DO $$
BEGIN
  EXECUTE 'CREATE OR REPLACE FUNCTION auth.has_permission(required_permission text) RETURNS boolean AS $func$ SELECT public.has_permission(required_permission) $func$ LANGUAGE sql STABLE SECURITY DEFINER';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Cannot create auth.has_permission - will use public.has_permission in RLS policies';
END $$;

CREATE OR REPLACE FUNCTION public.jwt_vendor_id()
RETURNS integer AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::jsonb->>'vendor_id',
    ''
  )::integer;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean AS $$
  SELECT public.has_role('admin');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================
-- PART 3: Data Migration
-- ============================================

INSERT INTO public.user_roles (user_id, role, is_active, metadata, granted_at)
SELECT 
  aa.auth_id,
  'admin'::text,
  true,
  jsonb_build_object('source', 'admin_accounts', 'original_email', aa.email, 'migrated_at', now()),
  COALESCE(aa.created_at, now())
FROM public.admin_accounts aa
WHERE aa.auth_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = aa.auth_id AND ur.role = 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role, resource_id, is_active, metadata, granted_at)
SELECT 
  vu.auth_id,
  'vendor'::text,
  vu.vendor_id,
  true,
  jsonb_build_object('source', 'vendor_users', 'original_email', vu.email, 'vendor_name', v.vendor_name, 'migrated_at', now()),
  COALESCE(vu.created_at, now())
FROM public.vendor_users vu
JOIN public.vendors v ON v.id = vu.vendor_id
WHERE vu.auth_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = vu.auth_id AND ur.role = 'vendor')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role, is_active, metadata, granted_at)
SELECT 
  cp.user_id,
  'collector'::text,
  true,
  jsonb_build_object('source', 'collector_profiles', 'original_email', cp.email, 'migrated_at', now()),
  COALESCE(cp.created_at, now())
FROM public.collector_profiles cp
WHERE cp.user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = cp.user_id AND ur.role = 'collector')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role, is_active, metadata, granted_at)
SELECT DISTINCT
  o.customer_id::uuid,
  'collector'::text,
  true,
  jsonb_build_object('source', 'orders', 'customer_email', o.customer_email, 'migrated_at', now(), 'note', 'Collector role inferred from order history'),
  MIN(o.created_at)
FROM public.orders o
WHERE o.customer_id IS NOT NULL
  AND o.customer_id != ''
  AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = o.customer_id::uuid AND ur.role = 'collector')
  AND o.customer_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
GROUP BY o.customer_id, o.customer_email
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role, resource_id, is_active, metadata, granted_at)
SELECT 
  v.auth_id,
  'vendor'::text,
  v.id,
  CASE WHEN v.status = 'active' THEN true ELSE false END,
  jsonb_build_object('source', 'vendors_legacy_auth_id', 'vendor_name', v.vendor_name, 'vendor_status', v.status, 'migrated_at', now()),
  COALESCE(v.created_at, now())
FROM public.vendors v
WHERE v.auth_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = v.auth_id AND ur.role = 'vendor')
ON CONFLICT (user_id, role) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_user_roles_migration_source 
  ON public.user_roles ((metadata->>'source'));

-- ============================================
-- PART 4: Update RLS Policies
-- ============================================

DROP POLICY IF EXISTS "Vendors can access their own data" ON public.vendors;
DROP POLICY IF EXISTS "Admins can access all vendors" ON public.vendors;
CREATE POLICY "Vendors can access their own data"
  ON public.vendors FOR ALL
  USING (public.has_role('vendor') AND id = public.jwt_vendor_id());
CREATE POLICY "Admins can access all vendors"
  ON public.vendors FOR ALL
  USING (public.has_role('admin'));

DROP POLICY IF EXISTS "Vendors can view their own messages" ON public.vendor_messages;
DROP POLICY IF EXISTS "Vendors can create messages" ON public.vendor_messages;
DROP POLICY IF EXISTS "Vendors can update their messages" ON public.vendor_messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.vendor_messages;
CREATE POLICY "Vendors can view their own messages"
  ON public.vendor_messages FOR SELECT
  USING (public.has_role('vendor') AND vendor_name IN (SELECT v.vendor_name FROM public.vendors v WHERE v.id = public.jwt_vendor_id()));
CREATE POLICY "Vendors can create messages"
  ON public.vendor_messages FOR INSERT
  WITH CHECK (public.has_role('vendor') AND vendor_name IN (SELECT v.vendor_name FROM public.vendors v WHERE v.id = public.jwt_vendor_id()));
CREATE POLICY "Vendors can update their messages"
  ON public.vendor_messages FOR UPDATE
  USING (public.has_role('vendor') AND vendor_name IN (SELECT v.vendor_name FROM public.vendors v WHERE v.id = public.jwt_vendor_id()));
CREATE POLICY "Admins can manage all messages"
  ON public.vendor_messages FOR ALL
  USING (public.has_role('admin'));

DROP POLICY IF EXISTS "Vendors can view their notifications" ON public.vendor_notifications;
DROP POLICY IF EXISTS "Vendors can update their notifications" ON public.vendor_notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.vendor_notifications;
CREATE POLICY "Vendors can view their notifications"
  ON public.vendor_notifications FOR SELECT
  USING (public.has_role('vendor') AND vendor_name IN (SELECT v.vendor_name FROM public.vendors v WHERE v.id = public.jwt_vendor_id()));
CREATE POLICY "Vendors can update their notifications"
  ON public.vendor_notifications FOR UPDATE
  USING (public.has_role('vendor') AND vendor_name IN (SELECT v.vendor_name FROM public.vendors v WHERE v.id = public.jwt_vendor_id()));
CREATE POLICY "Admins can manage all notifications"
  ON public.vendor_notifications FOR ALL
  USING (public.has_role('admin'));

DROP POLICY IF EXISTS "Collectors can view their own items" ON public.order_line_items_v2;
DROP POLICY IF EXISTS "Vendors can view their items" ON public.order_line_items_v2;
DROP POLICY IF EXISTS "Admins can view all items" ON public.order_line_items_v2;
CREATE POLICY "Collectors can view their own items"
  ON public.order_line_items_v2 FOR SELECT
  USING (public.has_role('collector') AND (owner_id = auth.uid() OR LOWER(owner_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))));
CREATE POLICY "Vendors can view their items"
  ON public.order_line_items_v2 FOR SELECT
  USING (public.has_role('vendor') AND vendor_name IN (SELECT v.vendor_name FROM public.vendors v WHERE v.id = public.jwt_vendor_id()));
CREATE POLICY "Admins can manage all items"
  ON public.order_line_items_v2 FOR ALL
  USING (public.has_role('admin'));

DROP POLICY IF EXISTS "Users can view their own profile" ON public.collector_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.collector_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.collector_profiles;
CREATE POLICY "Collectors can view their own profile"
  ON public.collector_profiles FOR SELECT
  USING (public.has_role('collector') AND user_id = auth.uid());
CREATE POLICY "Collectors can update their own profile"
  ON public.collector_profiles FOR UPDATE
  USING (public.has_role('collector') AND user_id = auth.uid());
CREATE POLICY "Collectors can insert their own profile"
  ON public.collector_profiles FOR INSERT
  WITH CHECK (public.has_role('collector') AND user_id = auth.uid());
CREATE POLICY "Admins can manage all profiles"
  ON public.collector_profiles FOR ALL
  USING (public.has_role('admin'));

DROP POLICY IF EXISTS "Vendors can view their products" ON public.products;
DROP POLICY IF EXISTS "Vendors can manage their products" ON public.products;
DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
DROP POLICY IF EXISTS "Public can view published products" ON public.products;
CREATE POLICY "Vendors can view their products"
  ON public.products FOR SELECT
  USING (public.has_role('vendor') AND vendor_name IN (SELECT v.vendor_name FROM public.vendors v WHERE v.id = public.jwt_vendor_id()));
CREATE POLICY "Vendors can manage their products"
  ON public.products FOR ALL
  USING (public.has_role('vendor') AND vendor_name IN (SELECT v.vendor_name FROM public.vendors v WHERE v.id = public.jwt_vendor_id()));
CREATE POLICY "Admins can manage all products"
  ON public.products FOR ALL
  USING (public.has_role('admin'));
CREATE POLICY "Public can view published products"
  ON public.products FOR SELECT
  USING (status = 'active');

-- ============================================
-- Success Message
-- ============================================

DO $$
DECLARE
  total_roles integer;
  admin_roles integer;
  vendor_roles integer;
  collector_roles integer;
BEGIN
  SELECT COUNT(*) INTO total_roles FROM public.user_roles;
  SELECT COUNT(*) INTO admin_roles FROM public.user_roles WHERE role = 'admin';
  SELECT COUNT(*) INTO vendor_roles FROM public.user_roles WHERE role = 'vendor';
  SELECT COUNT(*) INTO collector_roles FROM public.user_roles WHERE role = 'collector';
  
  RAISE NOTICE '================================';
  RAISE NOTICE 'RBAC System Successfully Applied!';
  RAISE NOTICE '================================';
  RAISE NOTICE 'Total roles: %', total_roles;
  RAISE NOTICE 'Admin roles: %', admin_roles;
  RAISE NOTICE 'Vendor roles: %', vendor_roles;
  RAISE NOTICE 'Collector roles: %', collector_roles;
  RAISE NOTICE '================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Verify JWT hook is enabled in config.toml';
  RAISE NOTICE '2. Test login and check JWT contains user_roles claim';
  RAISE NOTICE '3. Update API routes to use new withAuth middleware';
  RAISE NOTICE '================================';
END $$;
