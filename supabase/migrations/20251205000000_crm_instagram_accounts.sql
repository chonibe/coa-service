-- Migration: Instagram Accounts Table for CRM
-- Creates table for storing connected Instagram Business accounts

-- ============================================
-- PART 1: Instagram Accounts Table
-- ============================================

CREATE TABLE IF NOT EXISTS crm_instagram_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- Link to admin user who owns this account
  account_name TEXT NOT NULL, -- User-friendly name
  instagram_account_id TEXT NOT NULL, -- Instagram Business Account ID
  instagram_username TEXT, -- Instagram username
  access_token TEXT NOT NULL, -- Meta access token
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  sync_enabled BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB, -- Additional Instagram-specific data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, instagram_account_id)
);

-- ============================================
-- PART 2: Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_crm_instagram_accounts_user_id ON crm_instagram_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_instagram_accounts_account_id ON crm_instagram_accounts(instagram_account_id);
CREATE INDEX IF NOT EXISTS idx_crm_instagram_accounts_is_active ON crm_instagram_accounts(is_active);

-- ============================================
-- PART 3: Trigger for Updated At
-- ============================================

CREATE TRIGGER update_crm_instagram_accounts_updated_at
  BEFORE UPDATE ON crm_instagram_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

