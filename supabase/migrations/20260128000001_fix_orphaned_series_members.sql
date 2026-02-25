-- Migration to fix orphaned artwork_series_members records
-- Addresses issue where submission_id references don't exist in vendor_product_submissions

-- Create RPC function to find orphaned series members
CREATE OR REPLACE FUNCTION find_orphaned_series_members()
RETURNS TABLE (
  id UUID,
  series_id UUID,
  submission_id UUID,
  series_name TEXT,
  vendor_name TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    asm.id,
    asm.series_id,
    asm.submission_id,
    aseries.name as series_name,
    aseries.vendor_name
  FROM artwork_series_members asm
  LEFT JOIN vendor_product_submissions vps ON asm.submission_id = vps.id
  LEFT JOIN artwork_series aseries ON asm.series_id = aseries.id
  WHERE asm.submission_id IS NOT NULL
    AND vps.id IS NULL;
END;
$$;

-- Create function to clean up orphaned records
CREATE OR REPLACE FUNCTION cleanup_orphaned_series_members()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Delete orphaned series members
  WITH orphaned AS (
    SELECT asm.id
    FROM artwork_series_members asm
    LEFT JOIN vendor_product_submissions vps ON asm.submission_id = vps.id
    WHERE asm.submission_id IS NOT NULL
      AND vps.id IS NULL
  )
  DELETE FROM artwork_series_members
  WHERE id IN (SELECT id FROM orphaned);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Log the cleanup
  RAISE NOTICE 'Cleaned up % orphaned artwork_series_members records', deleted_count;

  RETURN deleted_count;
END;
$$;

-- Run the cleanup
SELECT cleanup_orphaned_series_members() as cleaned_count;

-- Add comment to track this fix
COMMENT ON FUNCTION find_orphaned_series_members() IS 'Finds artwork_series_members records with invalid submission_id references';
COMMENT ON FUNCTION cleanup_orphaned_series_members() IS 'Removes artwork_series_members records with orphaned submission_id references';