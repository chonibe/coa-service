-- RBAC System: Custom JWT Hook for Role Claims
-- Injects user roles and permissions into JWT access tokens
-- Date: 2026-01-26

-- ============================================
-- 1. Create custom_access_token hook function
-- ============================================

CREATE OR REPLACE FUNCTION public.custom_access_token(event jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  claims jsonb;
  user_roles_arr text[];
  user_permissions_arr text[];
  vendor_id_val integer;
  user_email text;
BEGIN
  -- Extract existing claims from event
  claims := event->'claims';
  
  -- Get user email for fallback checks
  user_email := event->>'email';
  
  -- Get user's active roles
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
  
  -- Get user's effective permissions
  SELECT array_agg(DISTINCT permission ORDER BY permission)
  INTO user_permissions_arr
  FROM public.get_user_permissions((event->>'user_id')::uuid);
  
  -- Inject roles into JWT claims
  claims := jsonb_set(
    claims, 
    '{user_roles}', 
    to_jsonb(COALESCE(user_roles_arr, '{}'::text[]))
  );
  
  -- Inject vendor_id if present
  IF vendor_id_val IS NOT NULL THEN
    claims := jsonb_set(
      claims,
      '{vendor_id}',
      to_jsonb(vendor_id_val)
    );
  END IF;
  
  -- Inject permissions array
  claims := jsonb_set(
    claims,
    '{user_permissions}',
    to_jsonb(COALESCE(user_permissions_arr, '{}'::text[]))
  );
  
  -- Add metadata about role system version
  claims := jsonb_set(
    claims,
    '{rbac_version}',
    to_jsonb('2.0'::text)
  );
  
  -- Return updated event with new claims
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.custom_access_token(jsonb) TO service_role;

-- ============================================
-- 2. Create helper function for JWT role checking
-- ============================================

-- This function can be used in RLS policies to check roles from JWT
-- Created in public schema to avoid auth schema permission issues
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

-- Create schema alias for backward compatibility (if auth schema access is available)
-- This allows RLS policies to use auth.has_role() syntax
DO $$
BEGIN
  -- Try to create function in auth schema if we have permissions
  -- If this fails, policies will use public.has_role() instead
  EXECUTE 'CREATE OR REPLACE FUNCTION auth.has_role(required_role text) RETURNS boolean AS $func$ SELECT public.has_role(required_role) $func$ LANGUAGE sql STABLE SECURITY DEFINER';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Cannot create auth.has_role - will use public.has_role in RLS policies';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating auth.has_role: %', SQLERRM;
END $$;

-- ============================================
-- 3. Create helper function for JWT permission checking
-- ============================================

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

-- Create schema alias for backward compatibility
DO $$
BEGIN
  EXECUTE 'CREATE OR REPLACE FUNCTION auth.has_permission(required_permission text) RETURNS boolean AS $func$ SELECT public.has_permission(required_permission) $func$ LANGUAGE sql STABLE SECURITY DEFINER';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Cannot create auth.has_permission - will use public.has_permission in RLS policies';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating auth.has_permission: %', SQLERRM;
END $$;

-- ============================================
-- 4. Create helper to get vendor_id from JWT
-- ============================================

CREATE OR REPLACE FUNCTION public.jwt_vendor_id()
RETURNS integer AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::jsonb->>'vendor_id',
    ''
  )::integer;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Create schema alias for backward compatibility
DO $$
BEGIN
  EXECUTE 'CREATE OR REPLACE FUNCTION auth.jwt_vendor_id() RETURNS integer AS $func$ SELECT public.jwt_vendor_id() $func$ LANGUAGE sql STABLE SECURITY DEFINER';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Cannot create auth.jwt_vendor_id - will use public.jwt_vendor_id in RLS policies';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating auth.jwt_vendor_id: %', SQLERRM;
END $$;

-- ============================================
-- 5. Create helper to check if user is admin
-- ============================================

-- This replaces the old is_admin_user() function with JWT-based check
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean AS $$
  SELECT public.has_role('admin');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================
-- 6. Test functions (can be removed in production)
-- ============================================

-- Function to test JWT claim extraction (for debugging)
CREATE OR REPLACE FUNCTION public.debug_jwt_claims()
RETURNS jsonb AS $$
  SELECT current_setting('request.jwt.claims', true)::jsonb;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================
-- Comments for documentation
-- ============================================

COMMENT ON FUNCTION public.custom_access_token IS 'Custom access token hook that injects user roles and permissions into JWT claims. Called by Supabase Auth during token generation.';
COMMENT ON FUNCTION public.has_role IS 'Check if current user has a specific role based on JWT claims. Use in RLS policies.';
COMMENT ON FUNCTION public.has_permission IS 'Check if current user has a specific permission based on JWT claims. Use in RLS policies.';
COMMENT ON FUNCTION public.jwt_vendor_id IS 'Get vendor_id from JWT claims for the current user. Returns NULL if not a vendor.';
COMMENT ON FUNCTION public.is_admin_user IS 'Check if current user is an admin (JWT-based). Replaces old email-based check.';
