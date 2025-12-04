-- Phase 7: Saved Views & Bulk Operations
-- Migration: Saved Views Database Schema

-- Create saved views table
CREATE TABLE IF NOT EXISTS crm_saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('person', 'company', 'conversation', 'activity')),
  filter_config JSONB NOT NULL DEFAULT '{}',
  sort_config JSONB DEFAULT NULL,
  column_config JSONB DEFAULT NULL,
  is_shared BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_views_workspace ON crm_saved_views(workspace_id);
CREATE INDEX IF NOT EXISTS idx_saved_views_entity_type ON crm_saved_views(entity_type);
CREATE INDEX IF NOT EXISTS idx_saved_views_created_by ON crm_saved_views(created_by);
CREATE INDEX IF NOT EXISTS idx_saved_views_workspace_entity ON crm_saved_views(workspace_id, entity_type);

-- Unique constraint: Only one default view per entity type per workspace
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_views_default_per_entity 
  ON crm_saved_views(workspace_id, entity_type) 
  WHERE is_default = true;

-- Add updated_at trigger
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

-- RLS Policies
ALTER TABLE crm_saved_views ENABLE ROW LEVEL SECURITY;

-- Users can view their own views and shared views in their workspace
CREATE POLICY "Users can view saved views"
  ON crm_saved_views FOR SELECT
  USING (
    created_by = auth.uid() OR 
    (is_shared = true AND workspace_id IN (
      SELECT workspace_id FROM crm_workspace_members WHERE user_id = auth.uid()
    ))
  );

-- Users can create saved views in their workspace
CREATE POLICY "Users can create saved views"
  ON crm_saved_views FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    workspace_id IN (
      SELECT workspace_id FROM crm_workspace_members WHERE user_id = auth.uid()
    )
  );

-- Users can update their own views
CREATE POLICY "Users can update their own views"
  ON crm_saved_views FOR UPDATE
  USING (
    created_by = auth.uid() AND
    workspace_id IN (
      SELECT workspace_id FROM crm_workspace_members WHERE user_id = auth.uid()
    )
  );

-- Users can delete their own views
CREATE POLICY "Users can delete their own views"
  ON crm_saved_views FOR DELETE
  USING (
    created_by = auth.uid() AND
    workspace_id IN (
      SELECT workspace_id FROM crm_workspace_members WHERE user_id = auth.uid()
    )
  );

-- Helper function to get default workspace ID for a user
CREATE OR REPLACE FUNCTION get_user_workspace_id(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_workspace_id UUID;
BEGIN
  -- Get the first workspace the user is a member of
  SELECT workspace_id INTO v_workspace_id
  FROM crm_workspace_members
  WHERE user_id = p_user_id
  LIMIT 1;
  
  RETURN v_workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

