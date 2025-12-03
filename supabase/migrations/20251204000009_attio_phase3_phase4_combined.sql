-- ============================================
-- Attio Phase 3 & Phase 4 - Combined Migration
-- Combines all Phase 3 and Phase 4 feature implementations
-- Date: 2025-12-04
-- ============================================
-- 
-- This migration includes:
-- - Phase 3: Additional Attribute Types
-- - Phase 3: Fuzzy Search Support
-- - Phase 3: Workspace Permissions System
-- - Phase 4: Inbox Enhancements (Email Threading, Tags, Enrichment)
-- ============================================

-- Drop existing functions if they exist to ensure idempotency
DROP FUNCTION IF EXISTS enable_pg_trgm_if_needed();
DROP FUNCTION IF EXISTS fuzzy_search_people(TEXT, NUMERIC, INTEGER);
DROP FUNCTION IF EXISTS fuzzy_search_companies(TEXT, NUMERIC, INTEGER);
DROP FUNCTION IF EXISTS check_workspace_permission(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS get_workspace_member_role(UUID, UUID);
DROP FUNCTION IF EXISTS validate_attribute_value(TEXT, JSONB);
DROP FUNCTION IF EXISTS format_attribute_value_for_display(TEXT, JSONB);
DROP FUNCTION IF EXISTS generate_thread_id();
DROP FUNCTION IF EXISTS calculate_thread_depth(UUID);
DROP FUNCTION IF EXISTS update_message_thread_info();
DROP FUNCTION IF EXISTS update_conversation_unread_count();
DROP FUNCTION IF EXISTS migrate_conversation_tags();
DROP FUNCTION IF EXISTS update_crm_workspace_members_updated_at();
DROP FUNCTION IF EXISTS update_crm_role_permissions_updated_at();
DROP FUNCTION IF EXISTS update_crm_tags_updated_at();

-- ============================================
-- PART 1: Additional Attribute Types (Phase 3)
-- ============================================

-- Helper function to validate attribute type values
CREATE OR REPLACE FUNCTION validate_attribute_value(
  p_field_type TEXT,
  p_value JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Validate based on field type
  CASE p_field_type
    WHEN 'location' THEN
      -- Location: { address, city, state, country, postal_code, coordinates: { lat, lng } }
      RETURN (
        p_value ? 'address' OR p_value ? 'city' OR p_value ? 'country'
      );
    
    WHEN 'currency' THEN
      -- Currency: { currency_value: number, currency_code: string (ISO 4217) }
      RETURN (
        p_value ? 'currency_value' AND
        p_value ? 'currency_code' AND
        (p_value->>'currency_value')::NUMERIC IS NOT NULL
      );
    
    WHEN 'rating' THEN
      -- Rating: { rating: number (1-5 or custom range), max_rating?: number }
      RETURN (
        p_value ? 'rating' AND
        (p_value->>'rating')::NUMERIC IS NOT NULL
      );
    
    WHEN 'timestamp' THEN
      -- Timestamp: { timestamp: ISO 8601 string, timezone?: string }
      RETURN (
        p_value ? 'timestamp' AND
        (p_value->>'timestamp')::TIMESTAMP WITH TIME ZONE IS NOT NULL
      );
    
    WHEN 'interaction' THEN
      -- Interaction: { interaction_type: string, interacted_at: ISO 8601, owner_actor?: { id, type } }
      RETURN (
        p_value ? 'interaction_type' AND
        p_value ? 'interacted_at'
      );
    
    WHEN 'actor_reference' THEN
      -- Actor Reference: { id: UUID, type: 'user' | 'system' | 'api' }
      RETURN (
        p_value ? 'id' AND
        p_value ? 'type'
      );
    
    WHEN 'personal_name' THEN
      -- Personal Name: { first_name, last_name, full_name, prefix?, suffix? }
      RETURN (
        p_value ? 'first_name' OR p_value ? 'last_name' OR p_value ? 'full_name'
      );
    
    ELSE
      -- Unknown type, allow it (for backward compatibility)
      RETURN true;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Helper function to format attribute value for display
CREATE OR REPLACE FUNCTION format_attribute_value_for_display(
  p_field_type TEXT,
  p_value JSONB
)
RETURNS TEXT AS $$
BEGIN
  CASE p_field_type
    WHEN 'location' THEN
      -- Format: "City, State, Country" or "Address, City"
      RETURN COALESCE(
        p_value->>'city' || 
        CASE WHEN p_value->>'state' IS NOT NULL THEN ', ' || p_value->>'state' ELSE '' END ||
        CASE WHEN p_value->>'country' IS NOT NULL THEN ', ' || p_value->>'country' ELSE '' END,
        p_value->>'address'
      );
    
    WHEN 'currency' THEN
      -- Format: "$1,234.56 USD"
      RETURN COALESCE(
        '$' || TO_CHAR((p_value->>'currency_value')::NUMERIC, 'FM999,999,999.00') || ' ' || (p_value->>'currency_code'),
        'N/A'
      );
    
    WHEN 'rating' THEN
      -- Format: "4/5" or "4 stars"
      RETURN COALESCE(
        (p_value->>'rating') || 
        CASE 
          WHEN p_value->>'max_rating' IS NOT NULL THEN '/' || p_value->>'max_rating'
          ELSE '/5'
        END,
        'N/A'
      );
    
    WHEN 'timestamp' THEN
      -- Format: ISO 8601 timestamp
      RETURN p_value->>'timestamp';
    
    WHEN 'interaction' THEN
      -- Format: "Email on 2023-01-01"
      RETURN COALESCE(
        INITCAP(p_value->>'interaction_type') || ' on ' || 
        TO_CHAR((p_value->>'interacted_at')::TIMESTAMP WITH TIME ZONE, 'YYYY-MM-DD'),
        'N/A'
      );
    
    WHEN 'actor_reference' THEN
      -- Format: "User: John Doe" or "System"
      RETURN COALESCE(
        INITCAP(p_value->>'type') || 
        CASE WHEN p_value->>'id' IS NOT NULL THEN ': ' || p_value->>'id' ELSE '' END,
        'N/A'
      );
    
    WHEN 'personal_name' THEN
      -- Format: "John Doe" or "Dr. John Doe, Jr."
      RETURN COALESCE(
        p_value->>'full_name',
        TRIM(COALESCE(p_value->>'prefix', '') || ' ' || 
             COALESCE(p_value->>'first_name', '') || ' ' || 
             COALESCE(p_value->>'last_name', '') || ' ' || 
             COALESCE(p_value->>'suffix', ''))
      );
    
    ELSE
      -- Default: return JSON string
      RETURN p_value::TEXT;
  END CASE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_attribute_value IS
'Validates attribute values based on their field type. Returns true if value structure is valid.';

COMMENT ON FUNCTION format_attribute_value_for_display IS
'Formats attribute values for human-readable display based on their field type.';

-- ============================================
-- PART 2: Fuzzy Search Support (Phase 3)
-- ============================================

-- Enable pg_trgm extension for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create function to enable pg_trgm if needed
CREATE OR REPLACE FUNCTION enable_pg_trgm_if_needed()
RETURNS void AS $$
BEGIN
  -- Extension is already enabled if we get here
  -- This function exists for API compatibility
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Fuzzy search function for people
CREATE OR REPLACE FUNCTION fuzzy_search_people(
  search_term TEXT,
  similarity_threshold NUMERIC DEFAULT 0.3,
  result_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  instagram_username TEXT,
  similarity NUMERIC,
  matched_fields TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    COALESCE(
      TRIM(COALESCE(c.first_name, '') || ' ' || COALESCE(c.last_name, '')),
      c.email,
      'Unknown'
    ) AS display_name,
    c.email,
    c.phone,
    c.instagram_username,
    GREATEST(
      COALESCE(similarity(COALESCE(c.first_name || ' ' || c.last_name, ''), search_term), 0),
      COALESCE(similarity(COALESCE(c.email, ''), search_term), 0),
      COALESCE(similarity(COALESCE(c.phone, ''), search_term), 0),
      COALESCE(similarity(COALESCE(c.instagram_username, ''), search_term), 0)
    ) AS similarity,
    ARRAY_REMOVE(ARRAY[
      CASE WHEN similarity(COALESCE(c.first_name || ' ' || c.last_name, ''), search_term) >= similarity_threshold THEN 'name' END,
      CASE WHEN similarity(COALESCE(c.email, ''), search_term) >= similarity_threshold THEN 'email' END,
      CASE WHEN similarity(COALESCE(c.phone, ''), search_term) >= similarity_threshold THEN 'phone' END,
      CASE WHEN similarity(COALESCE(c.instagram_username, ''), search_term) >= similarity_threshold THEN 'instagram' END
    ], NULL) AS matched_fields
  FROM crm_customers c
  WHERE
    c.is_archived = false
    AND (
      similarity(COALESCE(c.first_name || ' ' || c.last_name, ''), search_term) >= similarity_threshold
      OR similarity(COALESCE(c.email, ''), search_term) >= similarity_threshold
      OR similarity(COALESCE(c.phone, ''), search_term) >= similarity_threshold
      OR similarity(COALESCE(c.instagram_username, ''), search_term) >= similarity_threshold
      OR c.email ILIKE '%' || search_term || '%'
      OR c.first_name ILIKE '%' || search_term || '%'
      OR c.last_name ILIKE '%' || search_term || '%'
      OR c.phone ILIKE '%' || search_term || '%'
    )
  ORDER BY similarity DESC, c.created_at DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Fuzzy search function for companies
CREATE OR REPLACE FUNCTION fuzzy_search_companies(
  search_term TEXT,
  similarity_threshold NUMERIC DEFAULT 0.3,
  result_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  domain TEXT,
  website TEXT,
  industry TEXT,
  similarity NUMERIC,
  matched_fields TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.domain,
    c.website,
    c.industry,
    GREATEST(
      COALESCE(similarity(COALESCE(c.name, ''), search_term), 0),
      COALESCE(similarity(COALESCE(c.domain, ''), search_term), 0),
      COALESCE(similarity(COALESCE(c.website, ''), search_term), 0),
      COALESCE(similarity(COALESCE(c.industry, ''), search_term), 0)
    ) AS similarity,
    ARRAY_REMOVE(ARRAY[
      CASE WHEN similarity(COALESCE(c.name, ''), search_term) >= similarity_threshold THEN 'name' END,
      CASE WHEN similarity(COALESCE(c.domain, ''), search_term) >= similarity_threshold THEN 'domain' END,
      CASE WHEN similarity(COALESCE(c.website, ''), search_term) >= similarity_threshold THEN 'website' END,
      CASE WHEN similarity(COALESCE(c.industry, ''), search_term) >= similarity_threshold THEN 'industry' END
    ], NULL) AS matched_fields
  FROM crm_companies c
  WHERE
    c.is_archived = false
    AND (
      similarity(COALESCE(c.name, ''), search_term) >= similarity_threshold
      OR similarity(COALESCE(c.domain, ''), search_term) >= similarity_threshold
      OR similarity(COALESCE(c.website, ''), search_term) >= similarity_threshold
      OR similarity(COALESCE(c.industry, ''), search_term) >= similarity_threshold
      OR c.name ILIKE '%' || search_term || '%'
      OR c.domain ILIKE '%' || search_term || '%'
      OR c.website ILIKE '%' || search_term || '%'
    )
  ORDER BY similarity DESC, c.created_at DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_crm_customers_name_trgm ON crm_customers USING GIN ((COALESCE(first_name || ' ' || last_name, '')) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_crm_customers_email_trgm ON crm_customers USING GIN (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_crm_customers_phone_trgm ON crm_customers USING GIN (phone gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_crm_companies_name_trgm ON crm_companies USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_crm_companies_domain_trgm ON crm_companies USING GIN (domain gin_trgm_ops);

COMMENT ON FUNCTION fuzzy_search_people IS
'Fuzzy search for people using trigram similarity. Returns results with similarity scores and matched fields.';

COMMENT ON FUNCTION fuzzy_search_companies IS
'Fuzzy search for companies using trigram similarity. Returns results with similarity scores and matched fields.';

COMMENT ON FUNCTION enable_pg_trgm_if_needed IS
'Placeholder function for API compatibility. pg_trgm extension should be enabled via migration.';

-- ============================================
-- PART 3: Workspace Permissions System (Phase 3)
-- ============================================

-- Workspace Members Table
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

-- Permission Scopes Table
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

-- Role-Based Permission Templates
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

-- Helper Function to Check Permissions
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

-- Helper Function to Get User Role
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

-- Updated_at Triggers
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

-- ============================================
-- PART 4: Inbox Enhancements (Phase 4)
-- ============================================

-- Email Threading Support
DO $$
BEGIN
  -- Add thread_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crm_messages' AND column_name = 'thread_id'
  ) THEN
    ALTER TABLE crm_messages ADD COLUMN thread_id UUID;
  END IF;

  -- Add parent_message_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crm_messages' AND column_name = 'parent_message_id'
  ) THEN
    ALTER TABLE crm_messages ADD COLUMN parent_message_id UUID REFERENCES crm_messages(id) ON DELETE SET NULL;
  END IF;

  -- Add thread_depth column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crm_messages' AND column_name = 'thread_depth'
  ) THEN
    ALTER TABLE crm_messages ADD COLUMN thread_depth INTEGER DEFAULT 0;
  END IF;

  -- Add thread_order column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crm_messages' AND column_name = 'thread_order'
  ) THEN
    ALTER TABLE crm_messages ADD COLUMN thread_order INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create indexes for threading
CREATE INDEX IF NOT EXISTS idx_crm_messages_thread_id ON crm_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_crm_messages_parent_message_id ON crm_messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_crm_messages_thread_order ON crm_messages(thread_id, thread_order);

-- Tags System
CREATE TABLE IF NOT EXISTS crm_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6', -- Default blue color
  workspace_id UUID, -- For future multi-workspace support
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, workspace_id)
);

CREATE TABLE IF NOT EXISTS crm_conversation_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES crm_conversations(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES crm_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, tag_id)
);

-- Create indexes for tags
CREATE INDEX IF NOT EXISTS idx_crm_tags_name ON crm_tags(name);
CREATE INDEX IF NOT EXISTS idx_crm_tags_workspace_id ON crm_tags(workspace_id);
CREATE INDEX IF NOT EXISTS idx_crm_conversation_tags_conversation_id ON crm_conversation_tags(conversation_id);
CREATE INDEX IF NOT EXISTS idx_crm_conversation_tags_tag_id ON crm_conversation_tags(tag_id);

-- Enrichment Data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crm_customers' AND column_name = 'enrichment_data'
  ) THEN
    ALTER TABLE crm_customers ADD COLUMN enrichment_data JSONB DEFAULT '{}';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_crm_customers_enrichment_data ON crm_customers USING GIN (enrichment_data);

-- Conversation Enhancements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crm_conversations' AND column_name = 'is_starred'
  ) THEN
    ALTER TABLE crm_conversations ADD COLUMN is_starred BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crm_conversations' AND column_name = 'unread_count'
  ) THEN
    ALTER TABLE crm_conversations ADD COLUMN unread_count INTEGER DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_crm_conversations_is_starred ON crm_conversations(is_starred);
CREATE INDEX IF NOT EXISTS idx_crm_conversations_unread_count ON crm_conversations(unread_count);

-- Message Read Status
CREATE TABLE IF NOT EXISTS crm_message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES crm_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_message_reads_message_id ON crm_message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_crm_message_reads_user_id ON crm_message_reads(user_id);

-- Functions for Threading
CREATE OR REPLACE FUNCTION generate_thread_id()
RETURNS UUID AS $$
BEGIN
  RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_thread_depth(p_message_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_depth INTEGER := 0;
  v_parent_id UUID;
BEGIN
  SELECT parent_message_id INTO v_parent_id
  FROM crm_messages
  WHERE id = p_message_id;

  WHILE v_parent_id IS NOT NULL LOOP
    v_depth := v_depth + 1;
    SELECT parent_message_id INTO v_parent_id
    FROM crm_messages
    WHERE id = v_parent_id;
  END LOOP;

  RETURN v_depth;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_message_thread_info()
RETURNS TRIGGER AS $$
DECLARE
  v_thread_id UUID;
  v_depth INTEGER;
BEGIN
  -- If parent_message_id is set, use parent's thread_id
  IF NEW.parent_message_id IS NOT NULL THEN
    SELECT thread_id INTO v_thread_id
    FROM crm_messages
    WHERE id = NEW.parent_message_id;
    
    -- If parent has no thread_id, create new one
    IF v_thread_id IS NULL THEN
      v_thread_id := gen_random_uuid();
      UPDATE crm_messages
      SET thread_id = v_thread_id
      WHERE id = NEW.parent_message_id;
    END IF;
    
    NEW.thread_id := v_thread_id;
    NEW.thread_depth := calculate_thread_depth(NEW.id);
  ELSE
    -- Root message, create new thread_id
    IF NEW.thread_id IS NULL THEN
      NEW.thread_id := gen_random_uuid();
    END IF;
    NEW.thread_depth := 0;
  END IF;

  -- Set thread_order based on created_at within thread
  SELECT COALESCE(MAX(thread_order), 0) + 1 INTO NEW.thread_order
  FROM crm_messages
  WHERE thread_id = NEW.thread_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_message_thread_info_trigger ON crm_messages;
CREATE TRIGGER update_message_thread_info_trigger
  BEFORE INSERT ON crm_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_message_thread_info();

-- Function to Update Unread Count
CREATE OR REPLACE FUNCTION update_conversation_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update unread count when message is inserted
  IF TG_OP = 'INSERT' THEN
    UPDATE crm_conversations
    SET unread_count = (
      SELECT COUNT(*)
      FROM crm_messages m
      LEFT JOIN crm_message_reads mr ON m.id = mr.message_id AND mr.user_id = (
        SELECT user_id FROM crm_conversations WHERE id = NEW.conversation_id LIMIT 1
      )
      WHERE m.conversation_id = NEW.conversation_id
        AND m.direction = 'inbound'
        AND mr.id IS NULL
    )
    WHERE id = NEW.conversation_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_conversation_unread_count_trigger ON crm_messages;
CREATE TRIGGER update_conversation_unread_count_trigger
  AFTER INSERT ON crm_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_unread_count();

-- Function to Migrate Existing Tags
CREATE OR REPLACE FUNCTION migrate_conversation_tags()
RETURNS void AS $$
DECLARE
  v_conversation RECORD;
  v_tag_name TEXT;
  v_tag_id UUID;
BEGIN
  -- Loop through conversations that have tags array
  FOR v_conversation IN
    SELECT id, tags
    FROM crm_conversations
    WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
  LOOP
    -- Loop through each tag in the array
    FOREACH v_tag_name IN ARRAY v_conversation.tags
    LOOP
      -- Find or create tag
      SELECT id INTO v_tag_id
      FROM crm_tags
      WHERE name = v_tag_name
      LIMIT 1;

      IF v_tag_id IS NULL THEN
        INSERT INTO crm_tags (name, color)
        VALUES (v_tag_name, '#3B82F6')
        RETURNING id INTO v_tag_id;
      END IF;

      -- Link tag to conversation (ignore if already exists)
      INSERT INTO crm_conversation_tags (conversation_id, tag_id)
      VALUES (v_conversation.id, v_tag_id)
      ON CONFLICT (conversation_id, tag_id) DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Updated_at Triggers
CREATE OR REPLACE FUNCTION update_crm_tags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_crm_tags_updated_at
  BEFORE UPDATE ON crm_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_tags_updated_at();

-- Comments for Documentation
COMMENT ON TABLE crm_tags IS
'Tags that can be applied to conversations for organization and filtering';

COMMENT ON TABLE crm_conversation_tags IS
'Junction table linking conversations to tags';

COMMENT ON COLUMN crm_messages.thread_id IS
'UUID identifying the email thread this message belongs to';

COMMENT ON COLUMN crm_messages.parent_message_id IS
'Reference to the parent message in the thread hierarchy';

COMMENT ON COLUMN crm_messages.thread_depth IS
'Depth level in the thread tree (0 = root message)';

COMMENT ON COLUMN crm_messages.thread_order IS
'Order of message within thread (for sorting)';

COMMENT ON COLUMN crm_customers.enrichment_data IS
'JSONB object containing enriched data from AI/third-party sources';

COMMENT ON TABLE crm_message_reads IS
'Tracks which messages have been read by which users';

-- ============================================
-- Migration Complete
-- ============================================
-- 
-- This migration includes all Phase 3 and Phase 4 features:
-- ✅ Additional Attribute Types (Location, Currency, Rating, Timestamp, Interaction, Actor Reference, Personal Name)
-- ✅ Fuzzy Search Support (pg_trgm extension, search functions)
-- ✅ Workspace Permissions System (members, scopes, roles)
-- ✅ Inbox Enhancements (email threading, tags, enrichment data, read tracking)
-- 
-- To migrate existing tags from conversations.tags array, run:
-- SELECT migrate_conversation_tags();
-- ============================================

