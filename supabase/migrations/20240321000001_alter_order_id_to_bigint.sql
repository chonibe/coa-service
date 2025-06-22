-- Alter order_id column to bigint in order_line_items table
ALTER TABLE order_line_items
ALTER COLUMN order_id TYPE bigint USING order_id::bigint;

-- Add a comment to explain the change
COMMENT ON COLUMN order_line_items.order_id IS 'Shopify order ID (bigint to accommodate large Shopify IDs)'; 