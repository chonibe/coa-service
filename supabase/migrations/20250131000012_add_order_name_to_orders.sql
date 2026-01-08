-- Migration: Add order_name to orders table
-- This allows easier cross-referencing with Warehouse data (Platform IDs)

ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "order_name" TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_name ON "public"."orders"("order_name");

-- Backfill order_name from raw_shopify_order_data if available
UPDATE "public"."orders"
SET "order_name" = COALESCE(raw_shopify_order_data->>'name', '#' || order_number::text)
WHERE "order_name" IS NULL;

COMMENT ON COLUMN "public"."orders"."order_name" IS 'The Shopify Platform Order Name (e.g. #1174), used for cross-referencing with warehouse shipping data.';

