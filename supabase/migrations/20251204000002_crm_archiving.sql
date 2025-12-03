-- Migration: Archiving System (Soft Delete)
-- Adds is_archived flag to all relevant CRM tables
-- Date: 2025-12-04

-- ============================================
-- PART 1: Add is_archived to crm_customers (people)
-- ============================================

ALTER TABLE crm_customers 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_crm_customers_is_archived 
ON crm_customers(is_archived) 
WHERE is_archived = false;

-- ============================================
-- PART 2: Add is_archived to crm_companies
-- ============================================

ALTER TABLE crm_companies 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_crm_companies_is_archived 
ON crm_companies(is_archived) 
WHERE is_archived = false;

-- ============================================
-- PART 3: Add is_archived to crm_list_entries
-- ============================================

ALTER TABLE crm_list_entries 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_crm_list_entries_is_archived 
ON crm_list_entries(is_archived) 
WHERE is_archived = false;

-- ============================================
-- PART 4: Add is_archived to crm_activities
-- ============================================

ALTER TABLE crm_activities 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_crm_activities_is_archived 
ON crm_activities(is_archived) 
WHERE is_archived = false;

-- ============================================
-- PART 5: Helper function to archive a record
-- ============================================

CREATE OR REPLACE FUNCTION archive_record(
  p_table_name TEXT,
  p_record_id UUID
)
RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE %I SET is_archived = true WHERE id = $1', p_table_name)
  USING p_record_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 6: Helper function to restore a record
-- ============================================

CREATE OR REPLACE FUNCTION restore_record(
  p_table_name TEXT,
  p_record_id UUID
)
RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE %I SET is_archived = false WHERE id = $1', p_table_name)
  USING p_record_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 7: Comments for documentation
-- ============================================

COMMENT ON COLUMN crm_customers.is_archived IS 
'Soft delete flag. When true, record is archived and hidden from default queries.';

COMMENT ON COLUMN crm_companies.is_archived IS 
'Soft delete flag. When true, record is archived and hidden from default queries.';

COMMENT ON COLUMN crm_list_entries.is_archived IS 
'Soft delete flag. When true, entry is archived and hidden from default queries.';

COMMENT ON COLUMN crm_activities.is_archived IS 
'Soft delete flag. When true, activity is archived and hidden from default queries.';

COMMENT ON FUNCTION archive_record IS 
'Archives a record by setting is_archived = true';

COMMENT ON FUNCTION restore_record IS 
'Restores an archived record by setting is_archived = false';

