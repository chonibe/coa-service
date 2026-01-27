-- RBAC System: Unified Role Management
-- Migration to consolidate admin_accounts, vendor_users, and collector_profiles into a unified role system
-- Date: 2026-01-26

-- ============================================
-- 1. Create user_roles table (single source of truth)
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'vendor', 'collector')),
  resource_id integer, -- vendor_id for vendors, null for others
  is_active boolean DEFAULT true,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_resource_id ON public.user_roles(resource_id) WHERE resource_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(is_active) WHERE is_active = true;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_roles_updated_at();

-- ============================================
-- 2. Create role_permissions table
-- ============================================

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('admin', 'vendor', 'collector')),
  permission text NOT NULL,
  resource_type text, -- 'orders', 'products', 'payouts', 'vendors', 'collectors', etc.
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role, permission)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_resource_type ON public.role_permissions(resource_type) WHERE resource_type IS NOT NULL;

-- ============================================
-- 3. Create user_permission_overrides table
-- ============================================

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

-- ============================================
-- 4. Seed default role permissions
-- ============================================

INSERT INTO public.role_permissions (role, permission, resource_type, description) VALUES
  -- Admin permissions
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
  
  -- Vendor permissions
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
  
  -- Collector permissions
  ('collector', 'collector:dashboard', 'collectors', 'Access collector dashboard'),
  ('collector', 'artwork:view', 'artwork', 'View owned artwork'),
  ('collector', 'artwork:authenticate', 'artwork', 'Authenticate physical items via NFC'),
  ('collector', 'series:view', 'series', 'View series progress'),
  ('collector', 'profile:manage', 'profile', 'Manage collector profile'),
  ('collector', 'benefits:access', 'benefits', 'Access exclusive content and benefits'),
  ('collector', 'avatar:manage', 'avatar', 'Manage avatar and customization')
ON CONFLICT (role, permission) DO NOTHING;

-- ============================================
-- 5. Create audit log for role changes
-- ============================================

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

-- Trigger to log role changes
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

CREATE TRIGGER trigger_log_user_role_change
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_user_role_change();

-- ============================================
-- 6. Enable RLS on new tables
-- ============================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permission_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_audit_log ENABLE ROW LEVEL SECURITY;

-- Policies for user_roles (admins can manage all, users can view their own)
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

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

-- Policies for role_permissions (readable by all authenticated users)
CREATE POLICY "Authenticated users can view role permissions"
  ON public.role_permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

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

-- Policies for user_permission_overrides
CREATE POLICY "Users can view their own permission overrides"
  ON public.user_permission_overrides FOR SELECT
  USING (user_id = auth.uid());

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

-- Policies for audit log (admins only)
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

-- ============================================
-- 7. Helper functions
-- ============================================

-- Get all active roles for a user
CREATE OR REPLACE FUNCTION public.get_user_roles(p_user_id uuid)
RETURNS text[] AS $$
  SELECT array_agg(role)
  FROM public.user_roles
  WHERE user_id = p_user_id
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now());
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if user has a specific role
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

-- Get all permissions for a user (including overrides)
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id uuid)
RETURNS TABLE(permission text, source text) AS $$
BEGIN
  -- Get permissions from roles
  RETURN QUERY
  SELECT DISTINCT rp.permission, 'role:' || ur.role as source
  FROM public.user_roles ur
  JOIN public.role_permissions rp ON rp.role = ur.role
  WHERE ur.user_id = p_user_id
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > now())
  
  UNION
  
  -- Get granted permission overrides
  SELECT upo.permission, 'override' as source
  FROM public.user_permission_overrides upo
  WHERE upo.user_id = p_user_id
    AND upo.granted = true
    AND (upo.expires_at IS NULL OR upo.expires_at > now())
  
  EXCEPT
  
  -- Subtract revoked permission overrides
  SELECT upo.permission, 'override' as source
  FROM public.user_permission_overrides upo
  WHERE upo.user_id = p_user_id
    AND upo.granted = false
    AND (upo.expires_at IS NULL OR upo.expires_at > now());
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if user has a specific permission
CREATE OR REPLACE FUNCTION public.user_has_permission(p_user_id uuid, p_permission text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.get_user_permissions(p_user_id)
    WHERE permission = p_permission
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================
-- Comments for documentation
-- ============================================

COMMENT ON TABLE public.user_roles IS 'Unified table storing all user roles (admin, vendor, collector)';
COMMENT ON TABLE public.role_permissions IS 'Defines permissions available to each role';
COMMENT ON TABLE public.user_permission_overrides IS 'User-specific permission grants or revocations';
COMMENT ON TABLE public.user_role_audit_log IS 'Audit trail of all role changes';

COMMENT ON COLUMN public.user_roles.resource_id IS 'For vendors: vendor_id; for collectors: null; for admins: null';
COMMENT ON COLUMN public.user_roles.metadata IS 'Additional role-specific data (e.g., migration source, custom settings)';
COMMENT ON COLUMN public.user_permission_overrides.granted IS 'true = grant permission, false = revoke permission';
