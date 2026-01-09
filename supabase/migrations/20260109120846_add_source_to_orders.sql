-- Migration to add source column to orders table
ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "source" TEXT;

-- Index for source column
CREATE INDEX IF NOT EXISTS idx_orders_source ON "public"."orders"("source");

-- Backfill source column
-- Orders with shopify_id and not starting with WH- or 9 are likely shopify
UPDATE "public"."orders"
SET "source" = 'shopify'
WHERE "shopify_id" IS NOT NULL AND "id" NOT LIKE 'WH-%';

-- Orders starting with WH- or matching warehouse patterns are warehouse
UPDATE "public"."orders"
SET "source" = 'warehouse'
WHERE "source" IS NULL OR "id" LIKE 'WH-%';

COMMENT ON COLUMN "public"."orders"."source" IS 'The origin of the order: shopify, warehouse, or warehouse_made.';

