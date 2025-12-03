-- Migration: Relationship Attributes System
-- Supports bidirectional relationships between objects

-- ============================================
-- PART 1: Relationships Table
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

-- ============================================
-- PART 2: Add relationship_id to custom_fields
-- ============================================

ALTER TABLE crm_custom_fields
  ADD COLUMN IF NOT EXISTS relationship_id UUID REFERENCES crm_relationships(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_crm_custom_fields_relationship ON crm_custom_fields(relationship_id);

-- ============================================
-- PART 3: Bidirectional Update Function
-- ============================================

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

-- ============================================
-- PART 4: Trigger to Sync Relationship Updates
-- ============================================

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

CREATE TRIGGER sync_relationship_on_field_value_change
  AFTER INSERT OR UPDATE ON crm_custom_field_values
  FOR EACH ROW
  WHEN (NEW.field_value IS NOT NULL)
  EXECUTE FUNCTION trigger_sync_relationship();

-- ============================================
-- PART 5: Update Trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_crm_relationships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_crm_relationships_updated_at
  BEFORE UPDATE ON crm_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_relationships_updated_at();

