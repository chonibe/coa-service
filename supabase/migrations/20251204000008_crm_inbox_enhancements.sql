-- Migration: CRM Inbox Enhancements for Attio-Style UI
-- Adds email threading, tags system, and enrichment data support
-- Date: 2025-12-04

-- ============================================
-- PART 1: Email Threading Support
-- ============================================

-- Add threading columns to crm_messages if they don't exist
DO $$
BEGIN
  -- Add thread_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crm_messages' AND column_name = 'thread_id'
  ) THEN
    ALTER TABLE crm_messages ADD COLUMN thread_id UUID;
  END IF;

  -- Add parent_message_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crm_messages' AND column_name = 'parent_message_id'
  ) THEN
    ALTER TABLE crm_messages ADD COLUMN parent_message_id UUID REFERENCES crm_messages(id) ON DELETE SET NULL;
  END IF;

  -- Add thread_depth column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crm_messages' AND column_name = 'thread_depth'
  ) THEN
    ALTER TABLE crm_messages ADD COLUMN thread_depth INTEGER DEFAULT 0;
  END IF;

  -- Add thread_order column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crm_messages' AND column_name = 'thread_order'
  ) THEN
    ALTER TABLE crm_messages ADD COLUMN thread_order INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create indexes for threading
CREATE INDEX IF NOT EXISTS idx_crm_messages_thread_id ON crm_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_crm_messages_parent_message_id ON crm_messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_crm_messages_thread_order ON crm_messages(thread_id, thread_order);

-- ============================================
-- PART 2: Tags System
-- ============================================

-- Create crm_tags table
CREATE TABLE IF NOT EXISTS crm_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6', -- Default blue color
  workspace_id UUID, -- For future multi-workspace support
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, workspace_id)
);

-- Create crm_conversation_tags junction table
CREATE TABLE IF NOT EXISTS crm_conversation_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES crm_conversations(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES crm_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, tag_id)
);

-- Create indexes for tags
CREATE INDEX IF NOT EXISTS idx_crm_tags_name ON crm_tags(name);
CREATE INDEX IF NOT EXISTS idx_crm_tags_workspace_id ON crm_tags(workspace_id);
CREATE INDEX IF NOT EXISTS idx_crm_conversation_tags_conversation_id ON crm_conversation_tags(conversation_id);
CREATE INDEX IF NOT EXISTS idx_crm_conversation_tags_tag_id ON crm_conversation_tags(tag_id);

-- ============================================
-- PART 3: Enrichment Data
-- ============================================

-- Add enrichment_data column to crm_customers if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crm_customers' AND column_name = 'enrichment_data'
  ) THEN
    ALTER TABLE crm_customers ADD COLUMN enrichment_data JSONB DEFAULT '{}';
  END IF;
END $$;

-- Create index for enrichment data queries
CREATE INDEX IF NOT EXISTS idx_crm_customers_enrichment_data ON crm_customers USING GIN (enrichment_data);

-- ============================================
-- PART 4: Conversation Enhancements
-- ============================================

-- Add is_starred column to crm_conversations if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crm_conversations' AND column_name = 'is_starred'
  ) THEN
    ALTER TABLE crm_conversations ADD COLUMN is_starred BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add unread_count column to crm_conversations if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crm_conversations' AND column_name = 'unread_count'
  ) THEN
    ALTER TABLE crm_conversations ADD COLUMN unread_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_crm_conversations_is_starred ON crm_conversations(is_starred);
CREATE INDEX IF NOT EXISTS idx_crm_conversations_unread_count ON crm_conversations(unread_count);

-- ============================================
-- PART 5: Message Read Status
-- ============================================

-- Create crm_message_reads table to track read status
CREATE TABLE IF NOT EXISTS crm_message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES crm_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_crm_message_reads_message_id ON crm_message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_crm_message_reads_user_id ON crm_message_reads(user_id);

-- ============================================
-- PART 6: Functions for Threading
-- ============================================

-- Function to generate thread_id for messages
CREATE OR REPLACE FUNCTION generate_thread_id()
RETURNS UUID AS $$
BEGIN
  RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

-- Function to calculate thread depth
CREATE OR REPLACE FUNCTION calculate_thread_depth(p_message_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_depth INTEGER := 0;
  v_parent_id UUID;
BEGIN
  SELECT parent_message_id INTO v_parent_id
  FROM crm_messages
  WHERE id = p_message_id;

  WHILE v_parent_id IS NOT NULL LOOP
    v_depth := v_depth + 1;
    SELECT parent_message_id INTO v_parent_id
    FROM crm_messages
    WHERE id = v_parent_id;
  END LOOP;

  RETURN v_depth;
END;
$$ LANGUAGE plpgsql;

-- Function to update thread information
CREATE OR REPLACE FUNCTION update_message_thread_info()
RETURNS TRIGGER AS $$
DECLARE
  v_thread_id UUID;
  v_depth INTEGER;
BEGIN
  -- If parent_message_id is set, use parent's thread_id
  IF NEW.parent_message_id IS NOT NULL THEN
    SELECT thread_id INTO v_thread_id
    FROM crm_messages
    WHERE id = NEW.parent_message_id;
    
    -- If parent has no thread_id, create new one
    IF v_thread_id IS NULL THEN
      v_thread_id := gen_random_uuid();
      UPDATE crm_messages
      SET thread_id = v_thread_id
      WHERE id = NEW.parent_message_id;
    END IF;
    
    NEW.thread_id := v_thread_id;
    NEW.thread_depth := calculate_thread_depth(NEW.id);
  ELSE
    -- Root message, create new thread_id
    IF NEW.thread_id IS NULL THEN
      NEW.thread_id := gen_random_uuid();
    END IF;
    NEW.thread_depth := 0;
  END IF;

  -- Set thread_order based on created_at within thread
  SELECT COALESCE(MAX(thread_order), 0) + 1 INTO NEW.thread_order
  FROM crm_messages
  WHERE thread_id = NEW.thread_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update thread info on insert
DROP TRIGGER IF EXISTS update_message_thread_info_trigger ON crm_messages;
CREATE TRIGGER update_message_thread_info_trigger
  BEFORE INSERT ON crm_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_message_thread_info();

-- ============================================
-- PART 7: Function to Update Unread Count
-- ============================================

CREATE OR REPLACE FUNCTION update_conversation_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update unread count when message is inserted
  IF TG_OP = 'INSERT' THEN
    UPDATE crm_conversations
    SET unread_count = (
      SELECT COUNT(*)
      FROM crm_messages m
      LEFT JOIN crm_message_reads mr ON m.id = mr.message_id AND mr.user_id = (
        SELECT user_id FROM crm_conversations WHERE id = NEW.conversation_id LIMIT 1
      )
      WHERE m.conversation_id = NEW.conversation_id
        AND m.direction = 'inbound'
        AND mr.id IS NULL
    )
    WHERE id = NEW.conversation_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update unread count
DROP TRIGGER IF EXISTS update_conversation_unread_count_trigger ON crm_messages;
CREATE TRIGGER update_conversation_unread_count_trigger
  AFTER INSERT ON crm_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_unread_count();

-- ============================================
-- PART 8: Migrate Existing Tags
-- ============================================

-- Function to migrate tags from conversations.tags array to new system
CREATE OR REPLACE FUNCTION migrate_conversation_tags()
RETURNS void AS $$
DECLARE
  v_conversation RECORD;
  v_tag_name TEXT;
  v_tag_id UUID;
BEGIN
  -- Loop through conversations that have tags array
  FOR v_conversation IN
    SELECT id, tags
    FROM crm_conversations
    WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
  LOOP
    -- Loop through each tag in the array
    FOREACH v_tag_name IN ARRAY v_conversation.tags
    LOOP
      -- Find or create tag
      SELECT id INTO v_tag_id
      FROM crm_tags
      WHERE name = v_tag_name
      LIMIT 1;

      IF v_tag_id IS NULL THEN
        INSERT INTO crm_tags (name, color)
        VALUES (v_tag_name, '#3B82F6')
        RETURNING id INTO v_tag_id;
      END IF;

      -- Link tag to conversation (ignore if already exists)
      INSERT INTO crm_conversation_tags (conversation_id, tag_id)
      VALUES (v_conversation.id, v_tag_id)
      ON CONFLICT (conversation_id, tag_id) DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run migration (commented out - run manually after verifying)
-- SELECT migrate_conversation_tags();

-- ============================================
-- PART 9: Updated_at Triggers
-- ============================================

CREATE OR REPLACE FUNCTION update_crm_tags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_crm_tags_updated_at
  BEFORE UPDATE ON crm_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_tags_updated_at();

-- ============================================
-- PART 10: Comments for Documentation
-- ============================================

COMMENT ON TABLE crm_tags IS
'Tags that can be applied to conversations for organization and filtering';

COMMENT ON TABLE crm_conversation_tags IS
'Junction table linking conversations to tags';

COMMENT ON COLUMN crm_messages.thread_id IS
'UUID identifying the email thread this message belongs to';

COMMENT ON COLUMN crm_messages.parent_message_id IS
'Reference to the parent message in the thread hierarchy';

COMMENT ON COLUMN crm_messages.thread_depth IS
'Depth level in the thread tree (0 = root message)';

COMMENT ON COLUMN crm_messages.thread_order IS
'Order of message within thread (for sorting)';

COMMENT ON COLUMN crm_customers.enrichment_data IS
'JSONB object containing enriched data from AI/third-party sources';

COMMENT ON TABLE crm_message_reads IS
'Tracks which messages have been read by which users';

