-- Migration: Default Values for Attributes
-- Adds support for static and dynamic default values in custom fields
-- Date: 2025-12-04

-- ============================================
-- PART 1: Add default value columns to crm_custom_fields
-- ============================================

-- Add is_default_value_enabled flag
ALTER TABLE crm_custom_fields 
ADD COLUMN IF NOT EXISTS is_default_value_enabled BOOLEAN DEFAULT false;

-- Convert default_value from TEXT to JSONB to support complex defaults
-- First, create a new column
ALTER TABLE crm_custom_fields 
ADD COLUMN IF NOT EXISTS default_value_jsonb JSONB;

-- Migrate existing default_value TEXT to JSONB (if any exist)
-- Simple text values become: {"type": "static", "value": "text"}
UPDATE crm_custom_fields
SET default_value_jsonb = jsonb_build_object('type', 'static', 'value', default_value)
WHERE default_value IS NOT NULL 
  AND default_value_jsonb IS NULL;

-- Drop old default_value column after migration
-- ALTER TABLE crm_custom_fields DROP COLUMN IF EXISTS default_value;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_crm_custom_fields_default_enabled 
ON crm_custom_fields(is_default_value_enabled) 
WHERE is_default_value_enabled = true;

-- ============================================
-- PART 2: Helper function to process default values
-- ============================================

CREATE OR REPLACE FUNCTION process_default_value(
  p_default_value JSONB,
  p_field_type TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_default_type TEXT;
  v_value JSONB;
  v_result JSONB;
BEGIN
  -- If no default value, return NULL
  IF p_default_value IS NULL THEN
    RETURN NULL;
  END IF;

  -- Extract default type
  v_default_type := p_default_value->>'type';
  
  -- Handle static defaults
  IF v_default_type = 'static' THEN
    RETURN p_default_value->'value';
  END IF;

  -- Handle dynamic defaults
  IF v_default_type = 'dynamic' THEN
    v_value := p_default_value->'value';
    
    -- Handle "current-user" for actor-reference attributes
    IF v_value::text = '"current-user"' AND p_user_id IS NOT NULL THEN
      RETURN jsonb_build_object('id', p_user_id, 'type', 'user');
    END IF;

    -- Handle ISO 8601 Duration for date/timestamp attributes
    IF p_field_type IN ('date', 'timestamp') AND v_value::text LIKE '"P%' THEN
      -- Parse ISO 8601 duration (e.g., "P1M" = 1 month)
      -- This is a simplified version - full implementation would parse the duration
      -- For now, we'll store the duration string and process it in application code
      RETURN jsonb_build_object('duration', v_value);
    END IF;

    -- Return the dynamic value as-is for other cases
    RETURN v_value;
  END IF;

  -- Fallback: treat as static value
  RETURN p_default_value;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 3: Function to apply defaults when creating records
-- ============================================

CREATE OR REPLACE FUNCTION apply_field_defaults(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_field RECORD;
  v_default_value JSONB;
  v_processed_value JSONB;
BEGIN
  -- Loop through all active custom fields with defaults enabled
  FOR v_field IN
    SELECT id, field_name, field_type, default_value_jsonb
    FROM crm_custom_fields
    WHERE entity_type = p_entity_type
      AND is_active = true
      AND is_default_value_enabled = true
      AND default_value_jsonb IS NOT NULL
  LOOP
    -- Check if value already exists for this field
    IF NOT EXISTS (
      SELECT 1 
      FROM crm_custom_field_values 
      WHERE field_id = v_field.id 
        AND entity_type = p_entity_type 
        AND entity_id = p_entity_id
    ) THEN
      -- Process the default value
      v_processed_value := process_default_value(
        v_field.default_value_jsonb,
        v_field.field_type,
        p_user_id
      );

      -- Insert the default value
      IF v_processed_value IS NOT NULL THEN
        INSERT INTO crm_custom_field_values (
          field_id,
          entity_type,
          entity_id,
          field_value_json,
          created_at,
          updated_at
        ) VALUES (
          v_field.id,
          p_entity_type,
          p_entity_id,
          v_processed_value,
          NOW(),
          NOW()
        )
        ON CONFLICT (field_id, entity_type, entity_id) DO NOTHING;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 4: Comments for documentation
-- ============================================

COMMENT ON COLUMN crm_custom_fields.is_default_value_enabled IS 
'Whether default values should be applied when creating new records';

COMMENT ON COLUMN crm_custom_fields.default_value_jsonb IS 
'Default value in JSONB format. Supports:
- Static: {"type": "static", "value": <any JSON value>}
- Dynamic: {"type": "dynamic", "value": "current-user"} for actor references
- Dynamic: {"type": "dynamic", "value": "P1M"} for ISO 8601 durations (date/timestamp fields)';

COMMENT ON FUNCTION process_default_value IS 
'Processes a default value JSONB, handling both static and dynamic defaults';

COMMENT ON FUNCTION apply_field_defaults IS 
'Applies default values for all enabled custom fields when creating a new record';

