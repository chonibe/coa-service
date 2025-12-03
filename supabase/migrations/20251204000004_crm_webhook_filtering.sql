-- Migration: Webhook Filtering
-- Adds filter support to webhook subscriptions for server-side event filtering
-- Date: 2025-12-04

-- ============================================
-- PART 1: Create CRM webhook subscriptions table
-- ============================================

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

-- ============================================
-- PART 2: Helper function to evaluate webhook filters
-- ============================================

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

-- ============================================
-- PART 3: Comments for documentation
-- ============================================

COMMENT ON TABLE crm_webhook_subscriptions IS 
'CRM webhook subscriptions with server-side filtering support';

COMMENT ON COLUMN crm_webhook_subscriptions.filter IS 
'Server-side filter in format: {"field": "object", "operator": "equals", "value": "people"}
Supports nested paths: {"field": "actor.type", "operator": "equals", "value": "user"}';

COMMENT ON COLUMN crm_webhook_subscriptions.events IS 
'Array of event types to subscribe to (e.g., ["record.created", "record.updated"])';

COMMENT ON FUNCTION evaluate_webhook_filter IS 
'Evaluates a webhook filter against a payload. Returns true if payload matches filter.';

