-- Migration: Multi-Platform CRM Support
-- Extends CRM to support Email (multiple accounts), Instagram, Facebook, WhatsApp, and Shopify

-- ============================================
-- PART 1: Extend Platform Enum
-- ============================================

-- Extend crm_platform enum to include all platforms
DO $$
BEGIN
  -- Drop and recreate enum with all platforms
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crm_platform') THEN
    -- First, update existing enum values if needed
    -- Note: PostgreSQL doesn't support ALTER TYPE ADD VALUE in transaction blocks easily
    -- So we'll check and add values one by one
    
    -- Add 'facebook' if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'facebook' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'crm_platform')
    ) THEN
      ALTER TYPE crm_platform ADD VALUE IF NOT EXISTS 'facebook';
    END IF;
    
    -- Add 'whatsapp' if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'whatsapp' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'crm_platform')
    ) THEN
      ALTER TYPE crm_platform ADD VALUE IF NOT EXISTS 'whatsapp';
    END IF;
    
    -- Add 'shopify' if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'shopify' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'crm_platform')
    ) THEN
      ALTER TYPE crm_platform ADD VALUE IF NOT EXISTS 'shopify';
    END IF;
  ELSE
    -- Create enum if it doesn't exist
    CREATE TYPE crm_platform AS ENUM ('email', 'instagram', 'facebook', 'whatsapp', 'shopify');
  END IF;
END $$;

-- ============================================
-- PART 2: Email Accounts Table
-- ============================================

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

-- ============================================
-- PART 3: Facebook Accounts Table
-- ============================================

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

-- ============================================
-- PART 4: WhatsApp Accounts Table
-- ============================================

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

-- ============================================
-- PART 5: Update Conversations Table
-- ============================================

-- Add platform_account_id to link conversations to specific accounts
ALTER TABLE crm_conversations 
ADD COLUMN IF NOT EXISTS platform_account_id UUID;

-- Add index for platform_account_id
CREATE INDEX IF NOT EXISTS idx_crm_conversations_platform_account_id 
ON crm_conversations(platform_account_id);

-- Add comment explaining the field
COMMENT ON COLUMN crm_conversations.platform_account_id IS 
'References the account ID from crm_email_accounts, crm_facebook_accounts, or crm_whatsapp_accounts depending on platform';

-- ============================================
-- PART 6: Contact Identifiers for Deduplication
-- ============================================

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

-- ============================================
-- PART 7: Contact Merge History
-- ============================================

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

-- ============================================
-- PART 8: Update Customers Table for Multi-Platform
-- ============================================

-- Add Facebook and WhatsApp identifiers if they don't exist
ALTER TABLE crm_customers 
ADD COLUMN IF NOT EXISTS facebook_id TEXT,
ADD COLUMN IF NOT EXISTS facebook_username TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_id TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT;

-- Add indexes for new identifier fields
CREATE INDEX IF NOT EXISTS idx_crm_customers_facebook_id ON crm_customers(facebook_id);
CREATE INDEX IF NOT EXISTS idx_crm_customers_whatsapp_id ON crm_customers(whatsapp_id);
CREATE INDEX IF NOT EXISTS idx_crm_customers_whatsapp_phone ON crm_customers(whatsapp_phone);

-- ============================================
-- PART 9: Triggers for Updated At
-- ============================================

-- Add updated_at triggers for new tables
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
-- PART 10: Function to Find Duplicate Contacts
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

