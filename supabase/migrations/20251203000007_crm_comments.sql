-- Migration: Comments and Threads System
-- Allows commenting on records and list entries

CREATE TABLE IF NOT EXISTS crm_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_type TEXT NOT NULL, -- 'record' or 'list_entry'
  parent_id UUID NOT NULL,
  title TEXT,
  created_by_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_threads_parent ON crm_threads(parent_type, parent_id);
CREATE INDEX IF NOT EXISTS idx_crm_threads_created_by ON crm_threads(created_by_user_id);

CREATE TABLE IF NOT EXISTS crm_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES crm_threads(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES crm_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_crm_comments_thread ON crm_comments(thread_id);
CREATE INDEX IF NOT EXISTS idx_crm_comments_parent ON crm_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_crm_comments_created_by ON crm_comments(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_crm_comments_deleted ON crm_comments(deleted_at) WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION update_crm_threads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_crm_threads_updated_at
  BEFORE UPDATE ON crm_threads
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_threads_updated_at();

CREATE TRIGGER update_crm_comments_updated_at
  BEFORE UPDATE ON crm_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_threads_updated_at();

