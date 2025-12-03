-- Migration: Record Actions and Widgets System
-- Allows custom actions and widgets on record pages

-- ============================================
-- PART 1: Record Actions Table
-- ============================================

CREATE TABLE IF NOT EXISTS crm_record_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- Internal name
  label TEXT NOT NULL, -- Display label
  icon TEXT, -- Icon name
  entity_type TEXT NOT NULL, -- 'person', 'company', etc.
  action_type TEXT NOT NULL, -- 'server_function', 'modal', 'url'
  config JSONB DEFAULT '{}', -- Action configuration
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_record_actions_entity_type ON crm_record_actions(entity_type);
CREATE INDEX IF NOT EXISTS idx_crm_record_actions_display_order ON crm_record_actions(entity_type, display_order);
CREATE INDEX IF NOT EXISTS idx_crm_record_actions_is_active ON crm_record_actions(is_active);

-- ============================================
-- PART 2: Record Widgets Table
-- ============================================

CREATE TABLE IF NOT EXISTS crm_record_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- Internal name
  title TEXT NOT NULL, -- Display title
  entity_type TEXT NOT NULL, -- 'person', 'company', etc.
  widget_type TEXT NOT NULL, -- 'custom', 'chart', 'list', etc.
  config JSONB DEFAULT '{}', -- Widget configuration
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_record_widgets_entity_type ON crm_record_widgets(entity_type);
CREATE INDEX IF NOT EXISTS idx_crm_record_widgets_display_order ON crm_record_widgets(entity_type, display_order);
CREATE INDEX IF NOT EXISTS idx_crm_record_widgets_is_active ON crm_record_widgets(is_active);

-- ============================================
-- PART 3: Update Triggers
-- ============================================

CREATE OR REPLACE FUNCTION update_crm_record_actions_widgets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_crm_record_actions_updated_at
  BEFORE UPDATE ON crm_record_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_record_actions_widgets_updated_at();

CREATE TRIGGER update_crm_record_widgets_updated_at
  BEFORE UPDATE ON crm_record_widgets
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_record_actions_widgets_updated_at();

