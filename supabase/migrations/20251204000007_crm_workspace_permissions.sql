-- Migration: Workspace Permissions System
-- Adds granular permission system for workspace members
-- Date: 2025-12-04

-- ============================================
-- PART 1: Workspace Members Table
-- ============================================

CREATE TABLE IF NOT EXISTS crm_workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL, -- For multi-workspace support (currently single workspace)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member', 'viewer'
  permissions JSONB DEFAULT '{}', -- Granular permissions override
  invited_by_user_id UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_workspace_members_workspace_id ON crm_workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_crm_workspace_members_user_id ON crm_workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_workspace_members_role ON crm_workspace_members(role);
CREATE INDEX IF NOT EXISTS idx_crm_workspace_members_is_active ON crm_workspace_members(is_active);

-- ============================================
-- PART 2: Permission Scopes Table
-- ============================================

CREATE TABLE IF NOT EXISTS crm_permission_scopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- e.g., 'people.read', 'companies.write', 'settings.manage'
  description TEXT,
  resource_type TEXT NOT NULL, -- 'people', 'companies', 'settings', 'webhooks', etc.
  action TEXT NOT NULL, -- 'read', 'write', 'delete', 'manage'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_permission_scopes_resource_type ON crm_permission_scopes(resource_type);
CREATE INDEX IF NOT EXISTS idx_crm_permission_scopes_action ON crm_permission_scopes(action);

-- Insert default permission scopes
INSERT INTO crm_permission_scopes (name, description, resource_type, action) VALUES
  ('people.read', 'Read access to people records', 'people', 'read'),
  ('people.write', 'Create and update people records', 'people', 'write'),
  ('people.delete', 'Delete people records', 'people', 'delete'),
  ('companies.read', 'Read access to company records', 'companies', 'read'),
  ('companies.write', 'Create and update company records', 'companies', 'write'),
  ('companies.delete', 'Delete company records', 'companies', 'delete'),
  ('activities.read', 'Read access to activities', 'activities', 'read'),
  ('activities.write', 'Create and update activities', 'activities', 'write'),
  ('fields.manage', 'Manage custom fields', 'fields', 'manage'),
  ('lists.manage', 'Manage lists and collections', 'lists', 'manage'),
  ('webhooks.manage', 'Manage webhook subscriptions', 'webhooks', 'manage'),
  ('settings.manage', 'Manage workspace settings', 'settings', 'manage'),
  ('members.manage', 'Manage workspace members', 'members', 'manage')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- PART 3: Role-Based Permission Templates
-- ============================================

CREATE TABLE IF NOT EXISTS crm_role_permissions (
  role TEXT PRIMARY KEY, -- 'owner', 'admin', 'member', 'viewer'
  permissions JSONB NOT NULL, -- Array of permission scope names
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default role permissions
INSERT INTO crm_role_permissions (role, permissions) VALUES
  ('owner', '["people.read", "people.write", "people.delete", "companies.read", "companies.write", "companies.delete", "activities.read", "activities.write", "fields.manage", "lists.manage", "webhooks.manage", "settings.manage", "members.manage"]'::jsonb),
  ('admin', '["people.read", "people.write", "people.delete", "companies.read", "companies.write", "companies.delete", "activities.read", "activities.write", "fields.manage", "lists.manage", "webhooks.manage"]'::jsonb),
  ('member', '["people.read", "people.write", "companies.read", "companies.write", "activities.read", "activities.write"]'::jsonb),
  ('viewer', '["people.read", "companies.read", "activities.read"]'::jsonb)
ON CONFLICT (role) DO NOTHING;

-- ============================================
-- PART 4: Helper Function to Check Permissions
-- ============================================

CREATE OR REPLACE FUNCTION check_workspace_permission(
  p_user_id UUID,
  p_permission_name TEXT,
  p_workspace_id UUID DEFAULT NULL -- NULL means current workspace
)
RETURNS BOOLEAN AS $$
DECLARE
  v_member RECORD;
  v_role_permissions JSONB;
  v_custom_permissions JSONB;
  v_has_permission BOOLEAN := false;
BEGIN
  -- Get workspace member record
  SELECT * INTO v_member
  FROM crm_workspace_members
  WHERE user_id = p_user_id
    AND (p_workspace_id IS NULL OR workspace_id = p_workspace_id)
    AND is_active = true
  LIMIT 1;

  -- If user is not a member, deny access
  IF v_member IS NULL THEN
    RETURN false;
  END IF;

  -- Check custom permissions first (override role permissions)
  v_custom_permissions := v_member.permissions;
  IF v_custom_permissions IS NOT NULL AND jsonb_typeof(v_custom_permissions) = 'array' THEN
    -- Check if permission is explicitly granted or denied in custom permissions
    IF v_custom_permissions ? p_permission_name THEN
      RETURN (v_custom_permissions->>p_permission_name)::BOOLEAN;
    END IF
  END IF

  -- Get role-based permissions
  SELECT permissions INTO v_role_permissions
  FROM crm_role_permissions
  WHERE role = v_member.role;

  -- Check if permission is in role permissions
  IF v_role_permissions IS NOT NULL THEN
    v_has_permission := v_role_permissions ? p_permission_name;
  END IF;

  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 5: Helper Function to Get User Role
-- ============================================

CREATE OR REPLACE FUNCTION get_workspace_member_role(
  p_user_id UUID,
  p_workspace_id UUID DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM crm_workspace_members
  WHERE user_id = p_user_id
    AND (p_workspace_id IS NULL OR workspace_id = p_workspace_id)
    AND is_active = true
  LIMIT 1;

  RETURN COALESCE(v_role, 'none');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 6: Updated_at Triggers
-- ============================================

CREATE OR REPLACE FUNCTION update_crm_workspace_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_crm_workspace_members_updated_at
  BEFORE UPDATE ON crm_workspace_members
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_workspace_members_updated_at();

CREATE OR REPLACE FUNCTION update_crm_role_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_crm_role_permissions_updated_at
  BEFORE UPDATE ON crm_role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_role_permissions_updated_at();

-- ============================================
-- PART 7: Comments for documentation
-- ============================================

COMMENT ON TABLE crm_workspace_members IS
'Workspace members with roles and custom permissions';

COMMENT ON TABLE crm_permission_scopes IS
'Available permission scopes that can be granted to workspace members';

COMMENT ON TABLE crm_role_permissions IS
'Default permissions for each role (owner, admin, member, viewer)';

COMMENT ON FUNCTION check_workspace_permission IS
'Checks if a user has a specific permission. Returns true if granted, false otherwise.';

COMMENT ON FUNCTION get_workspace_member_role IS
'Gets the role of a workspace member. Returns role name or "none" if not a member.';

