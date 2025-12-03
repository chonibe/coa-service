-- Migration: Enhanced Data Model Features
-- Adds status attributes, enriched field tracking, and multi-select handling

-- ============================================
-- PART 1: Add is_enriched flag to custom fields
-- ============================================

ALTER TABLE crm_custom_fields
  ADD COLUMN IF NOT EXISTS is_enriched BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS enrichment_source TEXT; -- e.g., 'attio', 'clearbit', 'manual'

CREATE INDEX IF NOT EXISTS idx_crm_custom_fields_is_enriched ON crm_custom_fields(is_enriched);

-- ============================================
-- PART 2: Status Workflow Support
-- ============================================

-- Add status workflow configuration to custom fields
ALTER TABLE crm_custom_fields
  ADD COLUMN IF NOT EXISTS status_workflow JSONB; -- Configuration for status transitions

-- Example status_workflow structure:
-- {
--   "transitions": [
--     {"from": "new", "to": "in_progress"},
--     {"from": "in_progress", "to": "completed"},
--     {"from": "in_progress", "to": "cancelled"}
--   ],
--   "default_status": "new"
-- }

-- ============================================
-- PART 3: Multi-Select Handling Support
-- ============================================

-- The existing field_type='multi_select' already supports this
-- We just need to ensure the API handles append vs overwrite correctly
-- This is handled in the application layer, not database

-- ============================================
-- PART 4: Helper Function for Status Transitions
-- ============================================

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

