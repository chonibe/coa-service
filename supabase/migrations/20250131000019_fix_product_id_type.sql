-- Migration: Add product_id_text column to support both UUID and bigint formats
-- This allows flexibility for different product ID formats from Shopify

-- Add new text column
ALTER TABLE order_line_items_v2
ADD COLUMN IF NOT EXISTS product_id_text TEXT;

-- Copy data from bigint column to text column
UPDATE order_line_items_v2
SET product_id_text = product_id::TEXT
WHERE product_id_text IS NULL;

-- Update assign_edition_numbers function to use the new column
-- (The function already handles TEXT comparison, so it should work)

-- Add comment explaining the change
COMMENT ON COLUMN order_line_items_v2.product_id_text IS 'Product ID from Shopify as TEXT - supports both numeric IDs and UUID strings';

-- Note: We'll keep both columns for now for backward compatibility
-- Future migrations can drop the old bigint column after confirming everything works
