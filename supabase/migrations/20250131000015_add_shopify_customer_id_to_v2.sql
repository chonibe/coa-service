-- Migration: Add shopify_customer_id to order_line_items_v2
-- This resolves the type mismatch where customer_id was a UUID

ALTER TABLE order_line_items_v2 
ADD COLUMN IF NOT EXISTS shopify_customer_id TEXT;

COMMENT ON COLUMN order_line_items_v2.shopify_customer_id IS 'The numeric Shopify Customer ID, stored as TEXT for consistency with other Shopify IDs.';

-- Backfill from existing UUID customer_id is not possible as they are different ID spaces
-- But we can backfill from the orders table during the next resequencing.



