-- Migration to add comprehensive contact info to orders table
ALTER TABLE "public"."orders" 
ADD COLUMN IF NOT EXISTS "customer_name" TEXT,
ADD COLUMN IF NOT EXISTS "customer_phone" TEXT,
ADD COLUMN IF NOT EXISTS "shipping_address" JSONB;

-- Update existing records from raw_shopify_order_data where possible
-- Using explicit casting to ensure JSONB operators work
UPDATE "public"."orders"
SET 
  "customer_name" = TRIM(COALESCE(
    (raw_shopify_order_data::jsonb->'customer'->>'first_name' || ' ' || raw_shopify_order_data::jsonb->'customer'->>'last_name'),
    (raw_shopify_order_data::jsonb->'shipping_address'->>'first_name' || ' ' || raw_shopify_order_data::jsonb->'shipping_address'->>'last_name'),
    (raw_shopify_order_data::jsonb->'billing_address'->>'first_name' || ' ' || raw_shopify_order_data::jsonb->'billing_address'->>'last_name')
  )),
  "customer_phone" = COALESCE(
    raw_shopify_order_data::jsonb->'customer'->>'phone',
    raw_shopify_order_data::jsonb->'shipping_address'->>'phone',
    raw_shopify_order_data::jsonb->'billing_address'->>'phone'
  ),
  "shipping_address" = raw_shopify_order_data::jsonb->'shipping_address'
WHERE "raw_shopify_order_data" IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN "public"."orders"."customer_name" IS 'Full name of the customer for this specific order.';
COMMENT ON COLUMN "public"."orders"."customer_phone" IS 'Contact phone number for this specific order.';
COMMENT ON COLUMN "public"."orders"."shipping_address" IS 'The shipping address JSON for this specific order.';

