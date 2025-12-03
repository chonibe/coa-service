-- Migration: AI Enrichment & Insights
-- Store AI-generated data and insights for CRM records

-- ============================================
-- PART 1: AI Insights Table
-- ============================================

CREATE TABLE IF NOT EXISTS crm_ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'person', 'company', 'conversation'
  entity_id UUID NOT NULL,
  insight_type TEXT NOT NULL, -- 'enrichment', 'summary', 'segmentation', 'scoring', 'recommendation'
  insight_data JSONB NOT NULL, -- The actual insight data
  confidence_score NUMERIC(3,2), -- 0.00 to 1.00
  source TEXT, -- 'openai', 'anthropic', 'custom', etc.
  model_version TEXT, -- Model version used
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE, -- When this insight should be refreshed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(entity_type, entity_id, insight_type)
);

CREATE INDEX IF NOT EXISTS idx_crm_ai_insights_entity ON crm_ai_insights(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_crm_ai_insights_type ON crm_ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_crm_ai_insights_is_active ON crm_ai_insights(is_active);
CREATE INDEX IF NOT EXISTS idx_crm_ai_insights_expires_at ON crm_ai_insights(expires_at);

-- ============================================
-- PART 2: AI Enrichment Data
-- ============================================

-- This table stores enriched data from external sources
CREATE TABLE IF NOT EXISTS crm_ai_enrichment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES crm_customers(id) ON DELETE CASCADE,
  enrichment_type TEXT NOT NULL, -- 'profile_picture', 'location', 'social_links', 'company_info', 'email_verification', 'phone_validation'
  enrichment_data JSONB NOT NULL,
  source TEXT, -- 'clearbit', 'fullcontact', 'apollo', 'custom'
  confidence_score NUMERIC(3,2),
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, enrichment_type)
);

CREATE INDEX IF NOT EXISTS idx_crm_ai_enrichment_customer_id ON crm_ai_enrichment(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_ai_enrichment_type ON crm_ai_enrichment(enrichment_type);

-- ============================================
-- PART 3: Triggers
-- ============================================

CREATE TRIGGER update_crm_ai_insights_updated_at
  BEFORE UPDATE ON crm_ai_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_ai_enrichment_updated_at
  BEFORE UPDATE ON crm_ai_enrichment
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

