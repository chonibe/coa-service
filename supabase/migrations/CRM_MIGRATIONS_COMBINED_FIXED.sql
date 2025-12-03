-- ============================================
-- COMBINED CRM MIGRATIONS (FIXED)
-- Run this file in Supabase SQL Editor
-- ============================================
-- IMPORTANT: If you get errors about enum values, run the ALTER TYPE commands
-- at the end of this file separately (outside the transaction)
-- ============================================

-- ============================================
-- STEP 1: Extend Platform Enum (if needed)
-- ============================================
-- First, try to add enum values (these may need to run separately)
-- If crm_platform enum already exists with only 'email' and 'instagram',
-- you'll need to run these ALTER TYPE commands separately:

-- ALTER TYPE crm_platform ADD VALUE IF NOT EXISTS 'facebook';
-- ALTER TYPE crm_platform ADD VALUE IF NOT EXISTS 'whatsapp';
-- ALTER TYPE crm_platform ADD VALUE IF NOT EXISTS 'shopify';

-- Create enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crm_platform') THEN
    CREATE TYPE crm_platform AS ENUM ('email', 'instagram', 'facebook', 'whatsapp', 'shopify');
  END IF;
END $$;

-- ============================================
-- STEP 2: Email Accounts Table
-- ============================================

CREATE TABLE IF NOT EXISTS crm_email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  account_name TEXT NOT NULL,
  email_address TEXT NOT NULL,
  provider TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  provider_account_id TEXT,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  sync_enabled BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, email_address, provider)
);

CREATE INDEX IF NOT EXISTS idx_crm_email_accounts_user_id ON crm_email_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_email_accounts_email ON crm_email_accounts(email_address);
CREATE INDEX IF NOT EXISTS idx_crm_email_accounts_is_active ON crm_email_accounts(is_active);

-- ============================================
-- STEP 3: Facebook Accounts Table
-- ============================================

CREATE TABLE IF NOT EXISTS crm_facebook_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  account_name TEXT NOT NULL,
  page_id TEXT NOT NULL,
  page_name TEXT NOT NULL,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  sync_enabled BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, page_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_facebook_accounts_user_id ON crm_facebook_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_facebook_accounts_page_id ON crm_facebook_accounts(page_id);
CREATE INDEX IF NOT EXISTS idx_crm_facebook_accounts_is_active ON crm_facebook_accounts(is_active);

-- ============================================
-- STEP 4: WhatsApp Accounts Table
-- ============================================

CREATE TABLE IF NOT EXISTS crm_whatsapp_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  account_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  business_account_id TEXT,
  api_credentials JSONB,
  webhook_url TEXT,
  webhook_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sync_enabled BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, phone_number)
);

CREATE INDEX IF NOT EXISTS idx_crm_whatsapp_accounts_user_id ON crm_whatsapp_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_whatsapp_accounts_phone ON crm_whatsapp_accounts(phone_number);
CREATE INDEX IF NOT EXISTS idx_crm_whatsapp_accounts_is_active ON crm_whatsapp_accounts(is_active);

-- ============================================
-- STEP 5: Update Conversations Table
-- ============================================

ALTER TABLE crm_conversations 
ADD COLUMN IF NOT EXISTS platform_account_id UUID;

CREATE INDEX IF NOT EXISTS idx_crm_conversations_platform_account_id 
ON crm_conversations(platform_account_id);

COMMENT ON COLUMN crm_conversations.platform_account_id IS 
'References the account ID from crm_email_accounts, crm_facebook_accounts, or crm_whatsapp_accounts depending on platform';

-- ============================================
-- STEP 6: Contact Identifiers for Deduplication
-- ============================================

CREATE TABLE IF NOT EXISTS crm_contact_identifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES crm_customers(id) ON DELETE CASCADE,
  identifier_type TEXT NOT NULL,
  identifier_value TEXT NOT NULL,
  platform TEXT,
  verified BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(identifier_type, identifier_value)
);

CREATE INDEX IF NOT EXISTS idx_crm_contact_identifiers_customer_id ON crm_contact_identifiers(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_contact_identifiers_type_value ON crm_contact_identifiers(identifier_type, identifier_value);
CREATE INDEX IF NOT EXISTS idx_crm_contact_identifiers_platform ON crm_contact_identifiers(platform);

-- ============================================
-- STEP 7: Contact Merge History
-- ============================================

CREATE TABLE IF NOT EXISTS crm_contact_merge_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merged_into_customer_id UUID NOT NULL REFERENCES crm_customers(id) ON DELETE CASCADE,
  merged_from_customer_id UUID NOT NULL,
  merged_by_user_id UUID,
  merge_reason TEXT,
  merged_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_contact_merge_history_merged_into ON crm_contact_merge_history(merged_into_customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_contact_merge_history_merged_from ON crm_contact_merge_history(merged_from_customer_id);

-- ============================================
-- STEP 8: Update Customers Table for Multi-Platform
-- ============================================

ALTER TABLE crm_customers 
ADD COLUMN IF NOT EXISTS facebook_id TEXT,
ADD COLUMN IF NOT EXISTS facebook_username TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_id TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT;

CREATE INDEX IF NOT EXISTS idx_crm_customers_facebook_id ON crm_customers(facebook_id);
CREATE INDEX IF NOT EXISTS idx_crm_customers_whatsapp_id ON crm_customers(whatsapp_id);
CREATE INDEX IF NOT EXISTS idx_crm_customers_whatsapp_phone ON crm_customers(whatsapp_phone);

-- ============================================
-- STEP 9: Ensure update_updated_at_column function exists
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 10: Triggers for Updated At
-- ============================================

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

-- ============================================
-- STEP 11: Function to Find Duplicate Contacts
-- ============================================

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
-- STEP 12: Custom Fields System
-- ============================================

CREATE TABLE IF NOT EXISTS crm_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  field_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  is_required BOOLEAN DEFAULT false,
  is_unique BOOLEAN DEFAULT false,
  default_value TEXT,
  options JSONB,
  validation_rules JSONB,
  visibility_rules JSONB,
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

CREATE TABLE IF NOT EXISTS crm_custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES crm_custom_fields(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  field_value TEXT,
  field_value_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(field_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_custom_field_values_field_id ON crm_custom_field_values(field_id);
CREATE INDEX IF NOT EXISTS idx_crm_custom_field_values_entity ON crm_custom_field_values(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_crm_custom_field_values_value ON crm_custom_field_values(field_value);

CREATE TRIGGER update_crm_custom_fields_updated_at
  BEFORE UPDATE ON crm_custom_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_custom_field_values_updated_at
  BEFORE UPDATE ON crm_custom_field_values
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 13: Activities & Timeline System
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

CREATE TABLE IF NOT EXISTS crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type crm_activity_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  customer_id UUID REFERENCES crm_customers(id) ON DELETE CASCADE,
  company_id UUID,
  conversation_id UUID REFERENCES crm_conversations(id) ON DELETE SET NULL,
  order_id UUID,
  platform TEXT,
  platform_account_id UUID,
  created_by_user_id UUID,
  assigned_to_user_id UUID,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'normal',
  metadata JSONB,
  attachments JSONB,
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

CREATE TRIGGER update_crm_activities_updated_at
  BEFORE UPDATE ON crm_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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
-- STEP 14: Companies/Organizations
-- ============================================

CREATE TABLE IF NOT EXISTS crm_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT,
  website TEXT,
  industry TEXT,
  company_size TEXT,
  description TEXT,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  address JSONB,
  tags TEXT[],
  metadata JSONB,
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

ALTER TABLE crm_customers 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_crm_customers_company_id ON crm_customers(company_id);

CREATE TRIGGER update_crm_companies_updated_at
  BEFORE UPDATE ON crm_companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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

CREATE TRIGGER update_company_metrics_on_customer_update
  AFTER INSERT OR UPDATE ON crm_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_company_metrics();

-- ============================================
-- STEP 15: AI Enrichment & Insights
-- ============================================

CREATE TABLE IF NOT EXISTS crm_ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  insight_type TEXT NOT NULL,
  insight_data JSONB NOT NULL,
  confidence_score NUMERIC(3,2),
  source TEXT,
  model_version TEXT,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(entity_type, entity_id, insight_type)
);

CREATE INDEX IF NOT EXISTS idx_crm_ai_insights_entity ON crm_ai_insights(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_crm_ai_insights_type ON crm_ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_crm_ai_insights_is_active ON crm_ai_insights(is_active);
CREATE INDEX IF NOT EXISTS idx_crm_ai_insights_expires_at ON crm_ai_insights(expires_at);

CREATE TABLE IF NOT EXISTS crm_ai_enrichment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES crm_customers(id) ON DELETE CASCADE,
  enrichment_type TEXT NOT NULL,
  enrichment_data JSONB NOT NULL,
  source TEXT,
  confidence_score NUMERIC(3,2),
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, enrichment_type)
);

CREATE INDEX IF NOT EXISTS idx_crm_ai_enrichment_customer_id ON crm_ai_enrichment(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_ai_enrichment_type ON crm_ai_enrichment(enrichment_type);

CREATE TRIGGER update_crm_ai_insights_updated_at
  BEFORE UPDATE ON crm_ai_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_ai_enrichment_updated_at
  BEFORE UPDATE ON crm_ai_enrichment
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- IMPORTANT: Run these separately if enum already exists
-- ============================================
-- If the crm_platform enum already exists with only 'email' and 'instagram',
-- run these commands separately (one at a time) in the SQL Editor:
--
-- ALTER TYPE crm_platform ADD VALUE IF NOT EXISTS 'facebook';
-- ALTER TYPE crm_platform ADD VALUE IF NOT EXISTS 'whatsapp';
-- ALTER TYPE crm_platform ADD VALUE IF NOT EXISTS 'shopify';
--
-- These cannot be run inside a transaction block, so they must be executed
-- separately after the main migration completes.
-- ============================================

