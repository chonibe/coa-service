-- ============================================
-- Attio-Style CRM Upgrade - Combined Migration
-- Combines all Attio-style enhancements into a single migration
-- Date: 2025-12-03
-- ============================================

-- ============================================
-- PART 1: Saved Views System
-- ============================================

CREATE TABLE IF NOT EXISTS crm_saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  entity_type TEXT NOT NULL, -- 'person', 'company', 'conversation', 'activity'
  filters JSONB NOT NULL DEFAULT '{}', -- Filter object in Attio format
  sort JSONB DEFAULT '[]', -- Sort configuration: [{"field": "name", "direction": "asc"}]
  created_by_user_id UUID, -- Admin user who created this view
  is_shared BOOLEAN DEFAULT false, -- Whether view is shared with team
  is_default BOOLEAN DEFAULT false, -- Whether this is the default view for entity type
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_saved_views_entity_type ON crm_saved_views(entity_type);
CREATE INDEX IF NOT EXISTS idx_crm_saved_views_created_by ON crm_saved_views(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_crm_saved_views_is_shared ON crm_saved_views(is_shared);
CREATE INDEX IF NOT EXISTS idx_crm_saved_views_is_default ON crm_saved_views(is_default);

-- Create unique partial index to ensure only one default view per entity type per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_saved_views_unique_default 
  ON crm_saved_views(entity_type, created_by_user_id) 
  WHERE is_default = true;

CREATE OR REPLACE FUNCTION update_crm_saved_views_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_crm_saved_views_updated_at ON crm_saved_views;
CREATE TRIGGER update_crm_saved_views_updated_at
  BEFORE UPDATE ON crm_saved_views
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_saved_views_updated_at();

CREATE OR REPLACE FUNCTION get_default_saved_view(
  p_entity_type TEXT,
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  filters JSONB,
  sort JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sv.id,
    sv.name,
    sv.description,
    sv.filters,
    sv.sort
  FROM crm_saved_views sv
  WHERE sv.entity_type = p_entity_type
    AND sv.is_default = true
    AND (sv.created_by_user_id = p_user_id OR sv.is_shared = true)
  ORDER BY sv.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 2: Lists/Collections System
-- ============================================

CREATE TABLE IF NOT EXISTS crm_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  object_type TEXT NOT NULL, -- 'person', 'company'
  color TEXT, -- Hex color for UI
  icon TEXT, -- Icon name
  created_by_user_id UUID,
  is_system BOOLEAN DEFAULT false, -- System lists cannot be deleted
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_lists_object_type ON crm_lists(object_type);
CREATE INDEX IF NOT EXISTS idx_crm_lists_created_by ON crm_lists(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_crm_lists_is_system ON crm_lists(is_system);

CREATE TABLE IF NOT EXISTS crm_list_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES crm_lists(id) ON DELETE CASCADE,
  record_id UUID NOT NULL, -- ID of person or company
  record_type TEXT NOT NULL, -- 'person' or 'company'
  position INTEGER DEFAULT 0, -- For manual ordering
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(list_id, record_id, record_type)
);

CREATE INDEX IF NOT EXISTS idx_crm_list_entries_list_id ON crm_list_entries(list_id);
CREATE INDEX IF NOT EXISTS idx_crm_list_entries_record ON crm_list_entries(record_type, record_id);
CREATE INDEX IF NOT EXISTS idx_crm_list_entries_position ON crm_list_entries(list_id, position);

CREATE TABLE IF NOT EXISTS crm_list_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES crm_lists(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL, -- Internal field name
  display_name TEXT NOT NULL, -- User-facing label
  field_type TEXT NOT NULL, -- 'text', 'number', 'date', 'select', 'boolean', etc.
  is_required BOOLEAN DEFAULT false,
  default_value TEXT, -- Default value as text
  options JSONB, -- For select: array of options
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(list_id, field_name)
);

CREATE INDEX IF NOT EXISTS idx_crm_list_attributes_list_id ON crm_list_attributes(list_id);
CREATE INDEX IF NOT EXISTS idx_crm_list_attributes_display_order ON crm_list_attributes(list_id, display_order);

CREATE TABLE IF NOT EXISTS crm_list_entry_attribute_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES crm_list_entries(id) ON DELETE CASCADE,
  attribute_id UUID NOT NULL REFERENCES crm_list_attributes(id) ON DELETE CASCADE,
  value TEXT, -- Stored as text, cast based on field_type
  value_json JSONB, -- For complex types
  active_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active_until TIMESTAMP WITH TIME ZONE, -- NULL means current value
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(entry_id, attribute_id, active_from)
);

CREATE INDEX IF NOT EXISTS idx_crm_list_entry_attr_values_entry ON crm_list_entry_attribute_values(entry_id);
CREATE INDEX IF NOT EXISTS idx_crm_list_entry_attr_values_attr ON crm_list_entry_attribute_values(attribute_id);
CREATE INDEX IF NOT EXISTS idx_crm_list_entry_attr_values_active ON crm_list_entry_attribute_values(entry_id, attribute_id, active_from);

CREATE OR REPLACE FUNCTION update_crm_lists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_crm_lists_updated_at ON crm_lists;
CREATE TRIGGER update_crm_lists_updated_at
  BEFORE UPDATE ON crm_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_lists_updated_at();

DROP TRIGGER IF EXISTS update_crm_list_entries_updated_at ON crm_list_entries;
CREATE TRIGGER update_crm_list_entries_updated_at
  BEFORE UPDATE ON crm_list_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_lists_updated_at();

DROP TRIGGER IF EXISTS update_crm_list_attributes_updated_at ON crm_list_attributes;
CREATE TRIGGER update_crm_list_attributes_updated_at
  BEFORE UPDATE ON crm_list_attributes
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_lists_updated_at();

DROP TRIGGER IF EXISTS update_crm_list_entry_attr_values_updated_at ON crm_list_entry_attribute_values;
CREATE TRIGGER update_crm_list_entry_attr_values_updated_at
  BEFORE UPDATE ON crm_list_entry_attribute_values
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_lists_updated_at();

CREATE OR REPLACE FUNCTION get_list_entry_attribute_value(
  p_entry_id UUID,
  p_attribute_id UUID
)
RETURNS TABLE (
  value TEXT,
  value_json JSONB,
  active_from TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    leav.value,
    leav.value_json,
    leav.active_from
  FROM crm_list_entry_attribute_values leav
  WHERE leav.entry_id = p_entry_id
    AND leav.attribute_id = p_attribute_id
    AND (leav.active_until IS NULL OR leav.active_until > NOW())
  ORDER BY leav.active_from DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 3: Comments and Threads System
-- ============================================

CREATE TABLE IF NOT EXISTS crm_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_type TEXT NOT NULL, -- 'record' or 'list_entry'
  parent_id UUID NOT NULL,
  title TEXT,
  created_by_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_threads_parent ON crm_threads(parent_type, parent_id);
CREATE INDEX IF NOT EXISTS idx_crm_threads_created_by ON crm_threads(created_by_user_id);

CREATE TABLE IF NOT EXISTS crm_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES crm_threads(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES crm_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_crm_comments_thread ON crm_comments(thread_id);
CREATE INDEX IF NOT EXISTS idx_crm_comments_parent ON crm_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_crm_comments_created_by ON crm_comments(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_crm_comments_deleted ON crm_comments(deleted_at) WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION update_crm_threads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_crm_threads_updated_at ON crm_threads;
CREATE TRIGGER update_crm_threads_updated_at
  BEFORE UPDATE ON crm_threads
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_threads_updated_at();

DROP TRIGGER IF EXISTS update_crm_comments_updated_at ON crm_comments;
CREATE TRIGGER update_crm_comments_updated_at
  BEFORE UPDATE ON crm_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_threads_updated_at();

-- ============================================
-- PART 4: Attribute Value History
-- ============================================

ALTER TABLE crm_custom_field_values
  ADD COLUMN IF NOT EXISTS active_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS active_until TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS created_by_actor_id UUID;

CREATE INDEX IF NOT EXISTS idx_crm_custom_field_values_history 
  ON crm_custom_field_values(field_id, entity_type, entity_id, active_from);

CREATE OR REPLACE FUNCTION get_current_field_values(
  p_entity_type TEXT,
  p_entity_id UUID
)
RETURNS TABLE (
  field_id UUID,
  value TEXT,
  value_json JSONB,
  active_from TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cfv.field_id,
    cfv.value,
    cfv.value_json,
    cfv.active_from
  FROM crm_custom_field_values cfv
  WHERE cfv.entity_type = p_entity_type
    AND cfv.entity_id = p_entity_id
    AND (cfv.active_until IS NULL OR cfv.active_until > NOW())
  ORDER BY cfv.active_from DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 5: Relationship Attributes
-- ============================================

CREATE TABLE IF NOT EXISTS crm_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- e.g., "Company Team", "Associated Deals"
  object_a_type TEXT NOT NULL, -- 'person', 'company', etc.
  object_a_attribute_id UUID, -- Will reference crm_custom_fields.id
  object_b_type TEXT NOT NULL,
  object_b_attribute_id UUID, -- Will reference crm_custom_fields.id
  relationship_type TEXT NOT NULL, -- 'one-to-one', 'one-to-many', 'many-to-one', 'many-to-many'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(object_a_type, object_a_attribute_id, object_b_type, object_b_attribute_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_relationships_object_a ON crm_relationships(object_a_type, object_a_attribute_id);
CREATE INDEX IF NOT EXISTS idx_crm_relationships_object_b ON crm_relationships(object_b_type, object_b_attribute_id);

ALTER TABLE crm_custom_fields
  ADD COLUMN IF NOT EXISTS relationship_id UUID REFERENCES crm_relationships(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_crm_custom_fields_relationship ON crm_custom_fields(relationship_id);

CREATE OR REPLACE FUNCTION sync_relationship_attribute(
  p_relationship_id UUID,
  p_from_entity_type TEXT,
  p_from_entity_id UUID,
  p_to_entity_type TEXT,
  p_to_entity_id UUID,
  p_add BOOLEAN DEFAULT true
)
RETURNS VOID AS $$
DECLARE
  v_relationship RECORD;
  v_from_field_id UUID;
  v_to_field_id UUID;
BEGIN
  -- Get relationship details
  SELECT * INTO v_relationship
  FROM crm_relationships
  WHERE id = p_relationship_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Determine field IDs based on direction
  IF p_from_entity_type = v_relationship.object_a_type THEN
    v_from_field_id := v_relationship.object_a_attribute_id;
    v_to_field_id := v_relationship.object_b_attribute_id;
  ELSE
    v_from_field_id := v_relationship.object_b_attribute_id;
    v_to_field_id := v_relationship.object_a_attribute_id;
  END IF;

  -- Update the target side of the relationship
  IF p_add THEN
    -- Add reference (if not already present)
    INSERT INTO crm_custom_field_values (
      field_id,
      entity_type,
      entity_id,
      field_value,
      active_from
    )
    SELECT
      v_to_field_id,
      p_to_entity_type,
      p_to_entity_id,
      p_from_entity_id::TEXT,
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM crm_custom_field_values
      WHERE field_id = v_to_field_id
        AND entity_type = p_to_entity_type
        AND entity_id = p_to_entity_id
        AND field_value = p_from_entity_id::TEXT
        AND active_until IS NULL
    );
  ELSE
    -- Remove reference
    UPDATE crm_custom_field_values
    SET active_until = NOW()
    WHERE field_id = v_to_field_id
      AND entity_type = p_to_entity_type
      AND entity_id = p_to_entity_id
      AND field_value = p_from_entity_id::TEXT
      AND active_until IS NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_sync_relationship()
RETURNS TRIGGER AS $$
DECLARE
  v_field RECORD;
  v_relationship RECORD;
  v_entity_type TEXT;
  v_entity_id UUID;
  v_value UUID;
BEGIN
  -- Get field details
  SELECT * INTO v_field
  FROM crm_custom_fields
  WHERE id = NEW.field_id;

  IF v_field.relationship_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get relationship details
  SELECT * INTO v_relationship
  FROM crm_relationships
  WHERE id = v_field.relationship_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Determine entity type and ID from the field's entity_type
  v_entity_type := NEW.entity_type;
  v_entity_id := NEW.entity_id;

  -- Parse the value (should be a UUID reference)
  BEGIN
    v_value := NEW.field_value::UUID;
  EXCEPTION WHEN OTHERS THEN
    RETURN NEW; -- Invalid UUID, skip sync
  END;

  -- Determine target entity type
  DECLARE
    v_target_entity_type TEXT;
    v_target_entity_id UUID;
  BEGIN
    IF v_entity_type = v_relationship.object_a_type THEN
      v_target_entity_type := v_relationship.object_b_type;
    ELSE
      v_target_entity_type := v_relationship.object_a_type;
    END IF;

    v_target_entity_id := v_value;

    -- Sync the relationship
    IF NEW.active_until IS NULL THEN
      -- Adding/updating relationship
      PERFORM sync_relationship_attribute(
        v_field.relationship_id,
        v_entity_type,
        v_entity_id,
        v_target_entity_type,
        v_target_entity_id,
        true
      );
    ELSE
      -- Removing relationship
      PERFORM sync_relationship_attribute(
        v_field.relationship_id,
        v_entity_type,
        v_entity_id,
        v_target_entity_type,
        v_target_entity_id,
        false
      );
    END IF;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_relationship_on_field_value_change ON crm_custom_field_values;
CREATE TRIGGER sync_relationship_on_field_value_change
  AFTER INSERT OR UPDATE ON crm_custom_field_values
  FOR EACH ROW
  WHEN (NEW.field_value IS NOT NULL)
  EXECUTE FUNCTION trigger_sync_relationship();

CREATE OR REPLACE FUNCTION update_crm_relationships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_crm_relationships_updated_at ON crm_relationships;
CREATE TRIGGER update_crm_relationships_updated_at
  BEFORE UPDATE ON crm_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_relationships_updated_at();

-- ============================================
-- PART 6: Enhanced Data Model Features
-- ============================================

ALTER TABLE crm_custom_fields
  ADD COLUMN IF NOT EXISTS is_enriched BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS enrichment_source TEXT, -- e.g., 'attio', 'clearbit', 'manual'
  ADD COLUMN IF NOT EXISTS status_workflow JSONB; -- Configuration for status transitions

CREATE INDEX IF NOT EXISTS idx_crm_custom_fields_is_enriched ON crm_custom_fields(is_enriched);

CREATE OR REPLACE FUNCTION validate_status_transition(
  p_field_id UUID,
  p_from_status TEXT,
  p_to_status TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_workflow JSONB;
BEGIN
  -- Get workflow configuration
  SELECT status_workflow INTO v_workflow
  FROM crm_custom_fields
  WHERE id = p_field_id;

  IF v_workflow IS NULL THEN
    RETURN true; -- No workflow defined, allow any transition
  END IF;

  -- Check if transition is allowed
  IF v_workflow->'transitions' IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1
      FROM jsonb_array_elements(v_workflow->'transitions') AS transition
      WHERE transition->>'from' = p_from_status
        AND transition->>'to' = p_to_status
    );
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 7: Record Actions and Widgets
-- ============================================

CREATE TABLE IF NOT EXISTS crm_record_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- Internal name
  label TEXT NOT NULL, -- Display label
  icon TEXT, -- Icon name
  entity_type TEXT NOT NULL, -- 'person', 'company', etc.
  action_type TEXT NOT NULL, -- 'server_function', 'modal', 'url'
  config JSONB DEFAULT '{}', -- Action configuration
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_record_actions_entity_type ON crm_record_actions(entity_type);
CREATE INDEX IF NOT EXISTS idx_crm_record_actions_display_order ON crm_record_actions(entity_type, display_order);
CREATE INDEX IF NOT EXISTS idx_crm_record_actions_is_active ON crm_record_actions(is_active);

CREATE TABLE IF NOT EXISTS crm_record_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- Internal name
  title TEXT NOT NULL, -- Display title
  entity_type TEXT NOT NULL, -- 'person', 'company', etc.
  widget_type TEXT NOT NULL, -- 'custom', 'chart', 'list', etc.
  config JSONB DEFAULT '{}', -- Widget configuration
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_record_widgets_entity_type ON crm_record_widgets(entity_type);
CREATE INDEX IF NOT EXISTS idx_crm_record_widgets_display_order ON crm_record_widgets(entity_type, display_order);
CREATE INDEX IF NOT EXISTS idx_crm_record_widgets_is_active ON crm_record_widgets(is_active);

CREATE OR REPLACE FUNCTION update_crm_record_actions_widgets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_crm_record_actions_updated_at ON crm_record_actions;
CREATE TRIGGER update_crm_record_actions_updated_at
  BEFORE UPDATE ON crm_record_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_record_actions_widgets_updated_at();

DROP TRIGGER IF EXISTS update_crm_record_widgets_updated_at ON crm_record_widgets;
CREATE TRIGGER update_crm_record_widgets_updated_at
  BEFORE UPDATE ON crm_record_widgets
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_record_actions_widgets_updated_at();

-- ============================================
-- Migration Complete
-- ============================================

