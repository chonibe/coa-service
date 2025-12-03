-- Migration: Attribute Value History
-- Track historical values of custom fields

ALTER TABLE crm_custom_field_values
  ADD COLUMN IF NOT EXISTS active_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS active_until TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS created_by_actor_id UUID;

CREATE INDEX IF NOT EXISTS idx_crm_custom_field_values_history 
  ON crm_custom_field_values(field_id, entity_type, entity_id, active_from);

-- Function to get current values
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

