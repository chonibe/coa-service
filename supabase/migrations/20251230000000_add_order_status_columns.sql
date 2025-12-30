-- Migration to add cancelled and archived status columns to orders table
-- These fields will be synced from Shopify to make querying easier

-- Add cancelled_at column (timestamp when order was cancelled in Shopify)
ALTER TABLE "public"."orders" 
ADD COLUMN IF NOT EXISTS "cancelled_at" timestamp with time zone;

-- Add archived column (boolean indicating if order is archived in Shopify)
ALTER TABLE "public"."orders" 
ADD COLUMN IF NOT EXISTS "archived" boolean DEFAULT false;

-- Add shopify_order_status column (open, closed, etc.)
ALTER TABLE "public"."orders" 
ADD COLUMN IF NOT EXISTS "shopify_order_status" text;

-- Add index for cancelled orders
CREATE INDEX IF NOT EXISTS "idx_orders_cancelled_at" ON "public"."orders"("cancelled_at") WHERE "cancelled_at" IS NOT NULL;

-- Add index for archived orders
CREATE INDEX IF NOT EXISTS "idx_orders_archived" ON "public"."orders"("archived") WHERE "archived" = true;

-- Add comment for documentation
COMMENT ON COLUMN "public"."orders"."cancelled_at" IS 'Timestamp when order was cancelled in Shopify. NULL if not cancelled.';
COMMENT ON COLUMN "public"."orders"."archived" IS 'Whether the order is archived in Shopify (based on tags or closed status).';
COMMENT ON COLUMN "public"."orders"."shopify_order_status" IS 'Shopify order status (open, closed, etc.).';

