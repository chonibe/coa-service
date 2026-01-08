-- Migration: Edition Number Uniqueness Constraint
-- Prevents duplicate edition numbers for the same product
-- Only applies to active items with edition numbers

-- Create unique partial index to prevent duplicate edition numbers per product
-- Only applies to active items with non-null edition numbers
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_edition_per_product 
ON order_line_items_v2(product_id, edition_number) 
WHERE edition_number IS NOT NULL AND status = 'active';

-- Add comment
COMMENT ON INDEX idx_unique_edition_per_product IS 'Ensures no duplicate edition numbers exist for the same product. Only applies to active items with assigned edition numbers.';

