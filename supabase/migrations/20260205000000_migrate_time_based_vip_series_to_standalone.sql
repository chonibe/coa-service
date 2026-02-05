-- Migration: Move artworks from time_based and vip series back to standalone
-- Date: 2026-02-05
-- Purpose: Gradual rollout - hide time_based and vip unlock types from vendor portal
-- 
-- This migration:
-- 1. Removes artworks from time_based and vip series
-- 2. Sets them as standalone (series_id = NULL)
-- 3. Optionally deletes the now-empty series

-- Step 1: Get IDs of series with time_based and vip unlock types
-- This CTE will identify which series need to be migrated
WITH target_series AS (
  SELECT id, name, unlock_type
  FROM artwork_series
  WHERE unlock_type IN ('time_based', 'vip')
)
-- Step 2: Remove all members from these series
DELETE FROM artwork_series_members
WHERE series_id IN (SELECT id FROM target_series);

-- Step 3: Clear series_id from vendor_product_submissions
UPDATE vendor_product_submissions
SET series_id = NULL
WHERE series_id IN (
  SELECT id FROM artwork_series
  WHERE unlock_type IN ('time_based', 'vip')
);

-- Step 4: Delete the empty series (optional - kept for record/debugging)
-- Uncomment the line below if you want to fully delete these series
-- DELETE FROM artwork_series WHERE unlock_type IN ('time_based', 'vip');

-- Verification queries (run after migration):
-- Check how many artworks were migrated:
-- SELECT COUNT(*) as standalone_artworks FROM vendor_product_submissions WHERE series_id IS NULL;
--
-- Check if any time_based/vip series remain (should be 0 members):
-- SELECT s.id, s.name, s.unlock_type, COUNT(m.id) as member_count
-- FROM artwork_series s
-- LEFT JOIN artwork_series_members m ON s.id = m.series_id
-- WHERE s.unlock_type IN ('time_based', 'vip')
-- GROUP BY s.id, s.name, s.unlock_type;
