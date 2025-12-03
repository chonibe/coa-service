-- ============================================
-- COMBINED CRM MIGRATIONS
-- Run this file in Supabase SQL Editor
-- ============================================
-- This file combines all 5 CRM migration files:
-- - 20251203000000_crm_multi_platform.sql
-- - 20251203000001_crm_custom_fields.sql
-- - 20251203000002_crm_activities.sql
-- - 20251203000003_crm_companies.sql
-- - 20251203000004_crm_ai_enrichment.sql
-- ============================================

-- ============================================
-- MIGRATION 1: Multi-Platform CRM Support
-- ============================================

-- Extend crm_platform enum to include all platforms
-- Note: ALTER TYPE ADD VALUE cannot be run inside a transaction block
-- These commands must be run separately if the enum already exists

-- Check if enum exists and add values (run these separately if needed)
DO $$
BEGIN
  -- Only create enum if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crm_platform') THEN
    CREATE TYPE crm_platform AS ENUM ('email', 'instagram', 'facebook', 'whatsapp', 'shopify');
  END IF;
END $$;

-- Add 'facebook' if enum exists and value doesn't exist
-- Run this separately if you get an error about transaction blocks
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crm_platform') 
     AND NOT EXISTS (
       SELECT 1 FROM pg_enum 
       WHERE enumlabel = 'facebook' 
       AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'crm_platform')
     ) THEN
    -- This will fail in a transaction, so we'll handle it differently
    NULL; -- Placeholder - actual ALTER will be done outside transaction
  END IF;
END $$;

-- Add 'whatsapp' if enum exists and value doesn't exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crm_platform') 
     AND NOT EXISTS (
       SELECT 1 FROM pg_enum 
       WHERE enumlabel = 'whatsapp' 
       AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'crm_platform')
     ) THEN
    NULL; -- Placeholder
  END IF;
END $$;

-- Add 'shopify' if enum exists and value doesn't exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crm_platform') 
     AND NOT EXISTS (
       SELECT 1 FROM pg_enum 
       WHERE enumlabel = 'shopify' 
       AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'crm_platform')
     ) THEN
    NULL; -- Placeholder
  END IF;
END $$;

-- Email Accounts Table
CREATE TABLE IF NOT EXISTS crm_email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- Link to admin user who owns this account
  account_name TEXT NOT NULL, -- User-friendly name (e.g., "Work Gmail", "Personal Outlook")
  email_address TEXT NOT NULL,
  provider TEXT NOT NULL, -- 'gmail', 'outlook', 'custom'
  access_token TEXT, -- Encrypted OAuth access token
  refresh_token TEXT, -- Encrypted OAuth refresh token
  token_expires_at TIMESTAMP WITH TIME ZONE,
  provider_account_id TEXT, -- Provider's account ID
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- Default account for sending
  sync_enabled BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB, -- Additional provider-specific data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, email_address, provider)
);

CREATE INDEX IF NOT EXISTS idx_crm_email_accounts_user_id ON crm_email_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_email_accounts_email ON crm_email_accounts(email_address);
CREATE INDEX IF NOT EXISTS idx_crm_email_accounts_is_active ON crm_email_accounts(is_active);

-- Facebook Accounts Table
CREATE TABLE IF NOT EXISTS crm_facebook_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- Link to admin user who owns this account
  account_name TEXT NOT NULL, -- User-friendly name
  page_id TEXT NOT NULL, -- Facebook Page ID
  page_name TEXT NOT NULL, -- Facebook Page name
  access_token TEXT NOT NULL, -- Facebook Page access token
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  sync_enabled BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB, -- Additional Facebook-specific data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, page_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_facebook_accounts_user_id ON crm_facebook_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_facebook_accounts_page_id ON crm_facebook_accounts(page_id);
CREATE INDEX IF NOT EXISTS idx_crm_facebook_accounts_is_active ON crm_facebook_accounts(is_active);

-- WhatsApp Accounts Table
CREATE TABLE IF NOT EXISTS crm_whatsapp_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- Link to admin user who owns this account
  account_name TEXT NOT NULL, -- User-friendly name
  phone_number TEXT NOT NULL, -- WhatsApp Business phone number
  business_account_id TEXT, -- WhatsApp Business Account ID
  api_credentials JSONB, -- Encrypted API credentials (API key, etc.)
  webhook_url TEXT, -- Webhook URL for receiving messages
  webhook_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sync_enabled BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB, -- Additional WhatsApp-specific data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, phone_number)
);

CREATE INDEX IF NOT EXISTS idx_crm_whatsapp_accounts_user_id ON crm_whatsapp_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_whatsapp_accounts_phone ON crm_whatsapp_accounts(phone_number);
CREATE INDEX IF NOT EXISTS idx_crm_whatsapp_accounts_is_active ON crm_whatsapp_accounts(is_active);

-- Update Conversations Table
ALTER TABLE crm_conversations 
ADD COLUMN IF NOT EXISTS platform_account_id UUID;

CREATE INDEX IF NOT EXISTS idx_crm_conversations_platform_account_id 
ON crm_conversations(platform_account_id);

COMMENT ON COLUMN crm_conversations.platform_account_id IS 
'References the account ID from crm_email_accounts, crm_facebook_accounts, or crm_whatsapp_accounts depending on platform';

-- Contact Identifiers for Deduplication
CREATE TABLE IF NOT EXISTS crm_contact_identifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES crm_customers(id) ON DELETE CASCADE,
  identifier_type TEXT NOT NULL, -- 'email', 'phone', 'instagram_id', 'facebook_id', 'whatsapp_id', 'shopify_customer_id'
  identifier_value TEXT NOT NULL,
  platform TEXT, -- Which platform this identifier came from
  verified BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false, -- Primary identifier for this type
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(identifier_type, identifier_value)
);

CREATE INDEX IF NOT EXISTS idx_crm_contact_identifiers_customer_id ON crm_contact_identifiers(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_contact_identifiers_type_value ON crm_contact_identifiers(identifier_type, identifier_value);
CREATE INDEX IF NOT EXISTS idx_crm_contact_identifiers_platform ON crm_contact_identifiers(platform);

-- Contact Merge History
CREATE TABLE IF NOT EXISTS crm_contact_merge_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merged_into_customer_id UUID NOT NULL REFERENCES crm_customers(id) ON DELETE CASCADE,
  merged_from_customer_id UUID NOT NULL, -- Keep reference even if deleted
  merged_by_user_id UUID, -- Admin user who performed merge
  merge_reason TEXT,
  merged_data JSONB, -- Snapshot of what was merged
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_contact_merge_history_merged_into ON crm_contact_merge_history(merged_into_customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_contact_merge_history_merged_from ON crm_contact_merge_history(merged_from_customer_id);

-- Update Customers Table for Multi-Platform
ALTER TABLE crm_customers 
ADD COLUMN IF NOT EXISTS facebook_id TEXT,
ADD COLUMN IF NOT EXISTS facebook_username TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_id TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT;

CREATE INDEX IF NOT EXISTS idx_crm_customers_facebook_id ON crm_customers(facebook_id);
CREATE INDEX IF NOT EXISTS idx_crm_customers_whatsapp_id ON crm_customers(whatsapp_id);
CREATE INDEX IF NOT EXISTS idx_crm_customers_whatsapp_phone ON crm_customers(whatsapp_phone);

-- Triggers for Updated At (ensure function exists first)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  END IF;
END $$;

CREATE TRIGGER update_crm_email_accounts_updated_at
  BEFORE UPDATE ON crm_email_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_facebook_accounts_updated_at
  BEFORE UPDATE ON crm_facebook_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_whatsapp_accounts_updated_at
  BEFORE UPDATE ON crm_whatsapp_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_contact_identifiers_updated_at
  BEFORE UPDATE ON crm_contact_identifiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to Find Duplicate Contacts
CREATE OR REPLACE FUNCTION find_duplicate_contacts(
  p_customer_id UUID DEFAULT NULL
)
RETURNS TABLE (
  customer_id UUID,
  duplicate_customer_id UUID,
  match_score INTEGER,
  matching_identifiers TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  WITH customer_identifiers AS (
    SELECT 
      ci.customer_id,
      ci.identifier_type,
      ci.identifier_value,
      c.email,
      c.phone,
      c.instagram_id,
      c.facebook_id,
      c.whatsapp_id,
      c.shopify_customer_id
    FROM crm_contact_identifiers ci
    JOIN crm_customers c ON c.id = ci.customer_id
    WHERE (p_customer_id IS NULL OR ci.customer_id = p_customer_id)
  ),
  matches AS (
    SELECT DISTINCT
      ci1.customer_id,
      ci2.customer_id AS duplicate_customer_id,
      COUNT(*) * 10 AS match_score,
      ARRAY_AGG(DISTINCT ci1.identifier_type || ':' || ci1.identifier_value) AS matching_identifiers
    FROM customer_identifiers ci1
    JOIN customer_identifiers ci2 
      ON ci1.customer_id != ci2.customer_id
      AND (
        ci1.identifier_value = ci2.identifier_value
        OR (ci1.email IS NOT NULL AND ci1.email = ci2.email AND ci1.email != '')
        OR (ci1.phone IS NOT NULL AND ci1.phone = ci2.phone AND ci1.phone != '')
        OR (ci1.instagram_id IS NOT NULL AND ci1.instagram_id = ci2.instagram_id)
        OR (ci1.facebook_id IS NOT NULL AND ci1.facebook_id = ci2.facebook_id)
        OR (ci1.whatsapp_id IS NOT NULL AND ci1.whatsapp_id = ci2.whatsapp_id)
        OR (ci1.shopify_customer_id IS NOT NULL AND ci1.shopify_customer_id = ci2.shopify_customer_id)
      )
    GROUP BY ci1.customer_id, ci2.customer_id
    HAVING COUNT(*) > 0
  )
  SELECT 
    m.customer_id,
    m.duplicate_customer_id,
    m.match_score,
    m.matching_identifiers
  FROM matches m
  ORDER BY m.match_score DESC, m.customer_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MIGRATION 2: Custom Fields System
-- ============================================

-- Custom Fields Definitions
CREATE TABLE IF NOT EXISTS crm_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name TEXT NOT NULL, -- Internal field name (snake_case)
  display_name TEXT NOT NULL, -- User-facing label
  field_type TEXT NOT NULL, -- 'text', 'number', 'date', 'select', 'multi_select', 'boolean', 'email', 'phone', 'url'
  entity_type TEXT NOT NULL, -- 'person', 'company', 'conversation', 'order'
  is_required BOOLEAN DEFAULT false,
  is_unique BOOLEAN DEFAULT false,
  default_value TEXT, -- Default value as text (will be cast based on type)
  options JSONB, -- For select/multi_select: array of options
  validation_rules JSONB, -- Validation rules (min, max, pattern, etc.)
  visibility_rules JSONB, -- Conditional visibility rules
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(field_name, entity_type)
);

CREATE INDEX IF NOT EXISTS idx_crm_custom_fields_entity_type ON crm_custom_fields(entity_type);
CREATE INDEX IF NOT EXISTS idx_crm_custom_fields_is_active ON crm_custom_fields(is_active);
CREATE INDEX IF NOT EXISTS idx_crm_custom_fields_display_order ON crm_custom_fields(display_order);

-- Custom Field Values
CREATE TABLE IF NOT EXISTS crm_custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES crm_custom_fields(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'person', 'company', 'conversation', 'order'
  entity_id UUID NOT NULL, -- ID of the person, company, etc.
  field_value TEXT, -- Stored as text, cast based on field_type
  field_value_json JSONB, -- For complex types (multi_select, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(field_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_custom_field_values_field_id ON crm_custom_field_values(field_id);
CREATE INDEX IF NOT EXISTS idx_crm_custom_field_values_entity ON crm_custom_field_values(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_crm_custom_field_values_value ON crm_custom_field_values(field_value);

-- Triggers
CREATE TRIGGER update_crm_custom_fields_updated_at
  BEFORE UPDATE ON crm_custom_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_custom_field_values_updated_at
  BEFORE UPDATE ON crm_custom_field_values
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MIGRATION 3: Activities & Timeline System
-- ============================================

-- Activity Types Enum
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

-- Activities Table
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

-- Triggers
CREATE TRIGGER update_crm_activities_updated_at
  BEFORE UPDATE ON crm_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to Get Timeline for Record
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

-- ============================================
-- MIGRATION 4: Companies/Organizations
-- ============================================

-- Companies Table
CREATE TABLE IF NOT EXISTS crm_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT, -- Company website domain
  website TEXT,
  industry TEXT,
  company_size TEXT, -- '1-10', '11-50', '51-200', '201-500', '500+'
  description TEXT,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  address JSONB, -- Full address as JSON
  tags TEXT[],
  metadata JSONB,
  -- Aggregated metrics
  total_people INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC(10,2) DEFAULT 0,
  first_order_date TIMESTAMP WITH TIME ZONE,
  last_order_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_companies_name ON crm_companies(name);
CREATE INDEX IF NOT EXISTS idx_crm_companies_domain ON crm_companies(domain);
CREATE INDEX IF NOT EXISTS idx_crm_companies_email ON crm_companies(email);

-- Link Customers to Companies
ALTER TABLE crm_customers 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_crm_customers_company_id ON crm_customers(company_id);

-- Triggers
CREATE TRIGGER update_crm_companies_updated_at
  BEFORE UPDATE ON crm_companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to Update Company Metrics
CREATE OR REPLACE FUNCTION update_company_metrics()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.company_id IS NOT NULL THEN
    UPDATE crm_companies
    SET 
      total_people = (
        SELECT COUNT(*) 
        FROM crm_customers 
        WHERE company_id = NEW.company_id
      ),
      total_orders = (
        SELECT COALESCE(SUM(total_orders), 0)
        FROM crm_customers
        WHERE company_id = NEW.company_id
      ),
      total_spent = (
        SELECT COALESCE(SUM(total_spent), 0)
        FROM crm_customers
        WHERE company_id = NEW.company_id
      ),
      first_order_date = (
        SELECT MIN(first_order_date)
        FROM crm_customers
        WHERE company_id = NEW.company_id AND first_order_date IS NOT NULL
      ),
      last_order_date = (
        SELECT MAX(last_order_date)
        FROM crm_customers
        WHERE company_id = NEW.company_id AND last_order_date IS NOT NULL
      ),
      updated_at = NOW()
    WHERE id = NEW.company_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update company metrics when customer is updated
CREATE TRIGGER update_company_metrics_on_customer_update
  AFTER INSERT OR UPDATE ON crm_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_company_metrics();

-- ============================================
-- MIGRATION 5: AI Enrichment & Insights
-- ============================================

-- AI Insights Table
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

-- AI Enrichment Data
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

-- Triggers
CREATE TRIGGER update_crm_ai_insights_updated_at
  BEFORE UPDATE ON crm_ai_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_ai_enrichment_updated_at
  BEFORE UPDATE ON crm_ai_enrichment
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- All CRM tables, indexes, functions, and triggers have been created.
-- You can now use the CRM system with multi-platform support.
-- ============================================

