-- Alter order_id column to bigint in order_line_items_v2 table
ALTER TABLE order_line_items_v2
ALTER COLUMN order_id TYPE bigint USING order_id::bigint;

-- Add a comment to explain the change
COMMENT ON COLUMN order_line_items_v2.order_id IS 'Shopify order ID (bigint to accommodate large Shopify IDs)'; 