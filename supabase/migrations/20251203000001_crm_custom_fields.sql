-- Migration: Custom Fields System
-- Allows dynamic field definitions and values for CRM records

-- ============================================
-- PART 1: Custom Fields Definitions
-- ============================================

CREATE TABLE IF NOT EXISTS crm_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name TEXT NOT NULL, -- Internal field name (snake_case)
  display_name TEXT NOT NULL, -- User-facing label
  field_type TEXT NOT NULL, -- 'text', 'number', 'date', 'select', 'multi_select', 'boolean', 'email', 'phone', 'url'
  entity_type TEXT NOT NULL, -- 'person', 'company', 'conversation', 'order'
  is_required BOOLEAN DEFAULT false,
  is_unique BOOLEAN DEFAULT false,
  default_value TEXT, -- Default value as text (will be cast based on type)
  options JSONB, -- For select/multi_select: array of options
  validation_rules JSONB, -- Validation rules (min, max, pattern, etc.)
  visibility_rules JSONB, -- Conditional visibility rules
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(field_name, entity_type)
);

CREATE INDEX IF NOT EXISTS idx_crm_custom_fields_entity_type ON crm_custom_fields(entity_type);
CREATE INDEX IF NOT EXISTS idx_crm_custom_fields_is_active ON crm_custom_fields(is_active);
CREATE INDEX IF NOT EXISTS idx_crm_custom_fields_display_order ON crm_custom_fields(display_order);

-- ============================================
-- PART 2: Custom Field Values
-- ============================================

CREATE TABLE IF NOT EXISTS crm_custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES crm_custom_fields(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'person', 'company', 'conversation', 'order'
  entity_id UUID NOT NULL, -- ID of the person, company, etc.
  field_value TEXT, -- Stored as text, cast based on field_type
  field_value_json JSONB, -- For complex types (multi_select, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(field_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_custom_field_values_field_id ON crm_custom_field_values(field_id);
CREATE INDEX IF NOT EXISTS idx_crm_custom_field_values_entity ON crm_custom_field_values(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_crm_custom_field_values_value ON crm_custom_field_values(field_value);

-- ============================================
-- PART 3: Triggers
-- ============================================

CREATE TRIGGER update_crm_custom_fields_updated_at
  BEFORE UPDATE ON crm_custom_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_custom_field_values_updated_at
  BEFORE UPDATE ON crm_custom_field_values
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

