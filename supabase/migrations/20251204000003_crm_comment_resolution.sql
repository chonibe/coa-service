-- Migration: Comment Resolution
-- Adds resolve/unresolve functionality to comments
-- Date: 2025-12-04

-- ============================================
-- PART 1: Add resolution columns to crm_comments
-- ============================================

ALTER TABLE crm_comments 
ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN DEFAULT false;

ALTER TABLE crm_comments 
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE crm_comments 
ADD COLUMN IF NOT EXISTS resolved_by_user_id UUID;

-- Create indexes for resolution queries
CREATE INDEX IF NOT EXISTS idx_crm_comments_is_resolved 
ON crm_comments(is_resolved) 
WHERE is_resolved = true;

CREATE INDEX IF NOT EXISTS idx_crm_comments_resolved_by 
ON crm_comments(resolved_by_user_id);

-- ============================================
-- PART 2: Helper function to resolve a comment
-- ============================================

CREATE OR REPLACE FUNCTION resolve_comment(
  p_comment_id UUID,
  p_user_id UUID
)
RETURNS void AS $$
BEGIN
  UPDATE crm_comments
  SET 
    is_resolved = true,
    resolved_at = NOW(),
    resolved_by_user_id = p_user_id,
    updated_at = NOW()
  WHERE id = p_comment_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 3: Helper function to unresolve a comment
-- ============================================

CREATE OR REPLACE FUNCTION unresolve_comment(
  p_comment_id UUID
)
RETURNS void AS $$
BEGIN
  UPDATE crm_comments
  SET 
    is_resolved = false,
    resolved_at = NULL,
    resolved_by_user_id = NULL,
    updated_at = NOW()
  WHERE id = p_comment_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 4: Comments for documentation
-- ============================================

COMMENT ON COLUMN crm_comments.is_resolved IS 
'Whether this comment has been resolved';

COMMENT ON COLUMN crm_comments.resolved_at IS 
'Timestamp when the comment was resolved';

COMMENT ON COLUMN crm_comments.resolved_by_user_id IS 
'User ID who resolved the comment';

COMMENT ON FUNCTION resolve_comment IS 
'Resolves a comment by setting is_resolved = true and recording resolver';

COMMENT ON FUNCTION unresolve_comment IS 
'Unresolves a comment by setting is_resolved = false and clearing resolver info';


