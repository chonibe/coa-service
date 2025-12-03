-- ============================================
-- Attio Feature Gap Implementation - Combined Migration
-- Combines all Phase 1 and Phase 2 feature implementations
-- Date: 2025-12-04
-- ============================================

-- Drop existing functions if they exist to ensure idempotency
-- Note: We drop functions first, then triggers (if tables exist)
DROP FUNCTION IF EXISTS evaluate_webhook_filter(JSONB, JSONB);
DROP FUNCTION IF EXISTS resolve_comment(UUID, UUID);
DROP FUNCTION IF EXISTS unresolve_comment(UUID);
DROP FUNCTION IF EXISTS archive_record(TEXT, UUID);
DROP FUNCTION IF EXISTS restore_record(TEXT, UUID);
DROP FUNCTION IF EXISTS apply_field_defaults(TEXT, UUID, UUID);
DROP FUNCTION IF EXISTS process_default_value(JSONB, TEXT, UUID);
DROP FUNCTION IF EXISTS update_crm_webhook_subscriptions_updated_at();

-- ============================================
-- PART 1: Default Values for Attributes
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

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_crm_custom_fields_default_enabled 
ON crm_custom_fields(is_default_value_enabled) 
WHERE is_default_value_enabled = true;

-- Helper function to process default values
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

-- Function to apply defaults when creating records
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

-- ============================================
-- PART 2: Archiving System (Soft Delete)
-- ============================================

-- Add is_archived to crm_customers (people)
ALTER TABLE crm_customers 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_crm_customers_is_archived 
ON crm_customers(is_archived) 
WHERE is_archived = false;

-- Add is_archived to crm_companies
ALTER TABLE crm_companies 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_crm_companies_is_archived 
ON crm_companies(is_archived) 
WHERE is_archived = false;

-- Add is_archived to crm_list_entries
ALTER TABLE crm_list_entries 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_crm_list_entries_is_archived 
ON crm_list_entries(is_archived) 
WHERE is_archived = false;

-- Add is_archived to crm_activities
ALTER TABLE crm_activities 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_crm_activities_is_archived 
ON crm_activities(is_archived) 
WHERE is_archived = false;

-- Helper function to archive a record
CREATE OR REPLACE FUNCTION archive_record(
  p_table_name TEXT,
  p_record_id UUID
)
RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE %I SET is_archived = true WHERE id = $1', p_table_name)
  USING p_record_id;
END;
$$ LANGUAGE plpgsql;

-- Helper function to restore a record
CREATE OR REPLACE FUNCTION restore_record(
  p_table_name TEXT,
  p_record_id UUID
)
RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE %I SET is_archived = false WHERE id = $1', p_table_name)
  USING p_record_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON COLUMN crm_customers.is_archived IS 
'Soft delete flag. When true, record is archived and hidden from default queries.';

COMMENT ON COLUMN crm_companies.is_archived IS 
'Soft delete flag. When true, record is archived and hidden from default queries.';

COMMENT ON COLUMN crm_list_entries.is_archived IS 
'Soft delete flag. When true, entry is archived and hidden from default queries.';

COMMENT ON COLUMN crm_activities.is_archived IS 
'Soft delete flag. When true, activity is archived and hidden from default queries.';

COMMENT ON FUNCTION archive_record IS 
'Archives a record by setting is_archived = true';

COMMENT ON FUNCTION restore_record IS 
'Restores an archived record by setting is_archived = false';

-- ============================================
-- PART 3: Comment Resolution
-- ============================================

-- Add resolution columns to crm_comments
ALTER TABLE crm_comments 
ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN DEFAULT false;

ALTER TABLE crm_comments 
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE crm_comments 
ADD COLUMN IF NOT EXISTS resolved_by_user_id UUID;

-- Create indexes for resolution queries
CREATE INDEX IF NOT EXISTS idx_crm_comments_is_resolved 
ON crm_comments(is_resolved) 
WHERE is_resolved = true;

CREATE INDEX IF NOT EXISTS idx_crm_comments_resolved_by 
ON crm_comments(resolved_by_user_id);

-- Helper function to resolve a comment
CREATE OR REPLACE FUNCTION resolve_comment(
  p_comment_id UUID,
  p_user_id UUID
)
RETURNS void AS $$
BEGIN
  UPDATE crm_comments
  SET 
    is_resolved = true,
    resolved_at = NOW(),
    resolved_by_user_id = p_user_id,
    updated_at = NOW()
  WHERE id = p_comment_id;
END;
$$ LANGUAGE plpgsql;

-- Helper function to unresolve a comment
CREATE OR REPLACE FUNCTION unresolve_comment(
  p_comment_id UUID
)
RETURNS void AS $$
BEGIN
  UPDATE crm_comments
  SET 
    is_resolved = false,
    resolved_at = NULL,
    resolved_by_user_id = NULL,
    updated_at = NOW()
  WHERE id = p_comment_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON COLUMN crm_comments.is_resolved IS 
'Whether this comment has been resolved';

COMMENT ON COLUMN crm_comments.resolved_at IS 
'Timestamp when the comment was resolved';

COMMENT ON COLUMN crm_comments.resolved_by_user_id IS 
'User ID who resolved the comment';

COMMENT ON FUNCTION resolve_comment IS 
'Resolves a comment by setting is_resolved = true and recording resolver';

COMMENT ON FUNCTION unresolve_comment IS 
'Unresolves a comment by setting is_resolved = false and clearing resolver info';

-- ============================================
-- PART 4: Webhook Filtering
-- ============================================

-- Create CRM webhook subscriptions table
CREATE TABLE IF NOT EXISTS crm_webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] NOT NULL, -- Array of event types to subscribe to
  filter JSONB, -- Server-side filter: {"field": "object", "operator": "equals", "value": "people"}
  active BOOLEAN DEFAULT true,
  created_by_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_webhook_subscriptions_active 
ON crm_webhook_subscriptions(active) 
WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_crm_webhook_subscriptions_events 
ON crm_webhook_subscriptions USING GIN(events);

CREATE INDEX IF NOT EXISTS idx_crm_webhook_subscriptions_filter 
ON crm_webhook_subscriptions USING GIN(filter);

-- Helper function to evaluate webhook filters
CREATE OR REPLACE FUNCTION evaluate_webhook_filter(
  p_filter JSONB,
  p_payload JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  v_field TEXT;
  v_operator TEXT;
  v_value TEXT;
  v_payload_value TEXT;
BEGIN
  -- If no filter, always pass
  IF p_filter IS NULL THEN
    RETURN true;
  END IF;

  -- Extract filter components
  v_field := p_filter->>'field';
  v_operator := p_filter->>'operator';
  v_value := p_filter->>'value';

  -- Get value from payload (support nested paths like "actor.type")
  IF v_field LIKE '%.%' THEN
    -- Nested path (e.g., "actor.type")
    DECLARE
      path_parts TEXT[];
      current_value JSONB;
    BEGIN
      path_parts := string_to_array(v_field, '.');
      current_value := p_payload;
      
      FOR i IN 1..array_length(path_parts, 1) LOOP
        current_value := current_value->path_parts[i];
        IF current_value IS NULL THEN
          RETURN false;
        END IF;
      END LOOP;
      
      v_payload_value := current_value::TEXT;
    END;
  ELSE
    -- Simple field
    v_payload_value := (p_payload->>v_field)::TEXT;
  END IF;

  -- Evaluate operator
  IF v_operator = 'equals' THEN
    RETURN v_payload_value = v_value;
  ELSIF v_operator = 'not_equals' THEN
    RETURN v_payload_value != v_value;
  ELSE
    -- Unknown operator, default to false for safety
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at on webhook subscriptions
CREATE OR REPLACE FUNCTION update_crm_webhook_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists (only after table is created)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_webhook_subscriptions') THEN
    DROP TRIGGER IF EXISTS update_crm_webhook_subscriptions_updated_at ON crm_webhook_subscriptions;
  END IF;
END $$;

CREATE TRIGGER update_crm_webhook_subscriptions_updated_at
  BEFORE UPDATE ON crm_webhook_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_webhook_subscriptions_updated_at();

COMMENT ON TABLE crm_webhook_subscriptions IS 
'CRM webhook subscriptions with server-side filtering support';

COMMENT ON COLUMN crm_webhook_subscriptions.filter IS 
'Server-side filter in format: {"field": "object", "operator": "equals", "value": "people"}
Supports nested paths: {"field": "actor.type", "operator": "equals", "value": "user"}';

COMMENT ON COLUMN crm_webhook_subscriptions.events IS 
'Array of event types to subscribe to (e.g., ["record.created", "record.updated"])';

COMMENT ON FUNCTION evaluate_webhook_filter IS 
'Evaluates a webhook filter against a payload. Returns true if payload matches filter.';

