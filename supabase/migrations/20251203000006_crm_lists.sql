-- Migration: Lists/Collections System
-- Allows grouping records into lists with list-specific attributes

-- ============================================
-- PART 1: Lists Table
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

-- ============================================
-- PART 2: List Entries Table
-- ============================================

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

-- ============================================
-- PART 3: List Attributes Table
-- ============================================

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

-- ============================================
-- PART 4: List Entry Attribute Values Table
-- ============================================

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

-- ============================================
-- PART 5: Update Triggers
-- ============================================

CREATE OR REPLACE FUNCTION update_crm_lists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_crm_lists_updated_at
  BEFORE UPDATE ON crm_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_lists_updated_at();

CREATE TRIGGER update_crm_list_entries_updated_at
  BEFORE UPDATE ON crm_list_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_lists_updated_at();

CREATE TRIGGER update_crm_list_attributes_updated_at
  BEFORE UPDATE ON crm_list_attributes
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_lists_updated_at();

CREATE TRIGGER update_crm_list_entry_attr_values_updated_at
  BEFORE UPDATE ON crm_list_entry_attribute_values
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_lists_updated_at();

-- ============================================
-- PART 6: Helper Functions
-- ============================================

-- Function to get current attribute value for a list entry
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

