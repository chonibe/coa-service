-- Migration for Unified CRM System
-- Creates tables for tracking customers, conversations, and messages across Shopify, Email, and Instagram

-- ============================================
-- PART 1: Create ENUM types
-- ============================================

-- Platform enum for conversation sources
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crm_platform') THEN
    CREATE TYPE crm_platform AS ENUM ('email', 'instagram');
  END IF;
END $$;

-- Conversation status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crm_conversation_status') THEN
    CREATE TYPE crm_conversation_status AS ENUM ('open', 'closed', 'pending');
  END IF;
END $$;

-- Message direction enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crm_message_direction') THEN
    CREATE TYPE crm_message_direction AS ENUM ('inbound', 'outbound');
  END IF;
END $$;

-- ============================================
-- PART 2: Create crm_customers table
-- ============================================

CREATE TABLE IF NOT EXISTS crm_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_customer_id BIGINT UNIQUE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  instagram_username TEXT,
  instagram_id TEXT,
  notes TEXT,
  -- Order tracking
  chinadivision_order_ids TEXT[], -- Array of order IDs from ChinaDivision
  shopify_order_ids TEXT[], -- Array of Shopify order IDs
  total_orders INTEGER DEFAULT 0,
  first_order_date TIMESTAMP WITH TIME ZONE,
  last_order_date TIMESTAMP WITH TIME ZONE,
  total_spent NUMERIC(10,2) DEFAULT 0,
  -- Profile enrichment fields (for future data sources)
  phone TEXT,
  address JSONB, -- Store address data as JSON
  tags TEXT[], -- For custom tagging
  metadata JSONB, -- For additional data from various sources
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for crm_customers
CREATE INDEX IF NOT EXISTS idx_crm_customers_shopify_id ON crm_customers(shopify_customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_customers_email ON crm_customers(email);
CREATE INDEX IF NOT EXISTS idx_crm_customers_instagram_id ON crm_customers(instagram_id);
CREATE INDEX IF NOT EXISTS idx_crm_customers_total_orders ON crm_customers(total_orders);
CREATE INDEX IF NOT EXISTS idx_crm_customers_last_order_date ON crm_customers(last_order_date DESC);

-- ============================================
-- PART 3: Create crm_conversations table
-- ============================================

CREATE TABLE IF NOT EXISTS crm_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES crm_customers(id) ON DELETE CASCADE,
  platform crm_platform NOT NULL,
  status crm_conversation_status NOT NULL DEFAULT 'open',
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for crm_conversations
CREATE INDEX IF NOT EXISTS idx_crm_conversations_customer_id ON crm_conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_conversations_platform ON crm_conversations(platform);
CREATE INDEX IF NOT EXISTS idx_crm_conversations_status ON crm_conversations(status);
CREATE INDEX IF NOT EXISTS idx_crm_conversations_last_message_at ON crm_conversations(last_message_at DESC);

-- ============================================
-- PART 4: Create crm_messages table
-- ============================================

CREATE TABLE IF NOT EXISTS crm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES crm_conversations(id) ON DELETE CASCADE,
  direction crm_message_direction NOT NULL,
  content TEXT NOT NULL,
  external_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for crm_messages
CREATE INDEX IF NOT EXISTS idx_crm_messages_conversation_id ON crm_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_crm_messages_direction ON crm_messages(direction);
CREATE INDEX IF NOT EXISTS idx_crm_messages_external_id ON crm_messages(external_id);
CREATE INDEX IF NOT EXISTS idx_crm_messages_created_at ON crm_messages(created_at DESC);

-- ============================================
-- PART 5: Create function to update updated_at timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_crm_customers_updated_at
  BEFORE UPDATE ON crm_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_conversations_updated_at
  BEFORE UPDATE ON crm_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PART 6: Create function to update conversation last_message_at
-- ============================================

CREATE OR REPLACE FUNCTION update_conversation_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE crm_conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_message_at when a message is inserted
CREATE TRIGGER update_conversation_last_message_at_trigger
  AFTER INSERT ON crm_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message_at();

