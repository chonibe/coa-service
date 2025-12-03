-- Migration: Activities & Timeline System
-- Unified activity timeline for all CRM interactions

-- ============================================
-- PART 1: Activity Types Enum
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crm_activity_type') THEN
    CREATE TYPE crm_activity_type AS ENUM (
      'email',
      'call',
      'meeting',
      'note',
      'task',
      'order',
      'message',
      'facebook_message',
      'whatsapp_message',
      'instagram_message',
      'shopify_order',
      'custom'
    );
  END IF;
END $$;

-- ============================================
-- PART 2: Activities Table
-- ============================================

CREATE TABLE IF NOT EXISTS crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type crm_activity_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  customer_id UUID REFERENCES crm_customers(id) ON DELETE CASCADE,
  company_id UUID, -- Will reference crm_companies when created
  conversation_id UUID REFERENCES crm_conversations(id) ON DELETE SET NULL,
  order_id UUID, -- Can reference order from crm_customer_orders
  platform TEXT, -- 'email', 'instagram', 'facebook', 'whatsapp', 'shopify'
  platform_account_id UUID, -- Link to specific account if applicable
  created_by_user_id UUID, -- Admin user who created this activity
  assigned_to_user_id UUID, -- Admin user assigned to this activity
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  metadata JSONB, -- Additional activity data
  attachments JSONB, -- Array of attachment references
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_activities_customer_id ON crm_activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_company_id ON crm_activities(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_conversation_id ON crm_activities(conversation_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_activity_type ON crm_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_crm_activities_created_at ON crm_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_activities_created_by ON crm_activities(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_assigned_to ON crm_activities(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_is_completed ON crm_activities(is_completed);
CREATE INDEX IF NOT EXISTS idx_crm_activities_due_date ON crm_activities(due_date);
CREATE INDEX IF NOT EXISTS idx_crm_activities_platform ON crm_activities(platform);

-- ============================================
-- PART 3: Triggers
-- ============================================

CREATE TRIGGER update_crm_activities_updated_at
  BEFORE UPDATE ON crm_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PART 4: Function to Get Timeline for Record
-- ============================================

CREATE OR REPLACE FUNCTION get_customer_timeline(
  p_customer_id UUID,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  activity_type crm_activity_type,
  title TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  platform TEXT,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.activity_type,
    a.title,
    a.description,
    a.created_at,
    a.platform,
    a.metadata
  FROM crm_activities a
  WHERE a.customer_id = p_customer_id
  ORDER BY a.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

