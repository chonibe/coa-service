-- Migration: Saved Views System
-- Allows users to save and share filter combinations for quick access

-- ============================================
-- PART 1: Saved Views Table
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

-- Create unique partial index to ensure only one default view per entity type per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_saved_views_unique_default 
  ON crm_saved_views(entity_type, created_by_user_id) 
  WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_crm_saved_views_entity_type ON crm_saved_views(entity_type);
CREATE INDEX IF NOT EXISTS idx_crm_saved_views_created_by ON crm_saved_views(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_crm_saved_views_is_shared ON crm_saved_views(is_shared);
CREATE INDEX IF NOT EXISTS idx_crm_saved_views_is_default ON crm_saved_views(is_default);

-- ============================================
-- PART 2: Update Trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_crm_saved_views_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_crm_saved_views_updated_at
  BEFORE UPDATE ON crm_saved_views
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_saved_views_updated_at();

-- ============================================
-- PART 3: Helper Functions
-- ============================================

-- Function to get default view for entity type and user
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

