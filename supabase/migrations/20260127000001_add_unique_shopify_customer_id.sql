-- Migration: Add Unique Constraint on shopify_customer_id
-- Created: 2026-01-27
-- Purpose: Prevent duplicate collector profiles with the same Shopify customer ID

-- IMPORTANT: Run merge-duplicate-collector-profiles.ts script BEFORE applying this migration
-- This migration will fail if duplicates still exist

BEGIN;

-- Add partial unique index on shopify_customer_id (only for non-null values)
-- This allows multiple NULL values but ensures uniqueness for actual Shopify IDs
CREATE UNIQUE INDEX IF NOT EXISTS idx_collector_profiles_unique_shopify_customer_id 
ON collector_profiles (shopify_customer_id) 
WHERE shopify_customer_id IS NOT NULL;

-- Add comment explaining the constraint
COMMENT ON INDEX idx_collector_profiles_unique_shopify_customer_id IS 
  'Ensures each Shopify customer ID is associated with only one collector profile. NULL values are allowed (for collectors without Shopify accounts).';

-- Verify no duplicates exist
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT shopify_customer_id
    FROM collector_profiles
    WHERE shopify_customer_id IS NOT NULL
    GROUP BY shopify_customer_id
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'Cannot apply unique constraint: % duplicate shopify_customer_id values found. Run merge script first!', duplicate_count;
  END IF;

  RAISE NOTICE 'Unique constraint applied successfully. No duplicates found.';
END $$;

COMMIT;

-- Rollback script (if needed):
-- DROP INDEX IF EXISTS idx_collector_profiles_unique_shopify_customer_id;
