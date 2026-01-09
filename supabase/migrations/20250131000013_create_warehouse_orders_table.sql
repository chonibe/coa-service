-- Migration: Create Warehouse Orders Table
-- Stores raw and parsed PII from ChinaDivision to avoid redundant API calls

CREATE TABLE IF NOT EXISTS "public"."warehouse_orders" (
    "id" TEXT PRIMARY KEY, -- sys_order_id from ChinaDivision
    "order_id" TEXT NOT NULL, -- Platform Order Name (e.g. #1174)
    "shopify_order_id" TEXT, -- Numeric Shopify ID
    "ship_email" TEXT,
    "ship_name" TEXT,
    "ship_phone" TEXT,
    "ship_address" JSONB,
    "tracking_number" TEXT,
    "status" INTEGER,
    "status_name" TEXT,
    "raw_data" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_warehouse_orders_order_id ON "public"."warehouse_orders"("order_id");
CREATE INDEX IF NOT EXISTS idx_warehouse_orders_ship_email ON "public"."warehouse_orders"("ship_email");
CREATE INDEX IF NOT EXISTS idx_warehouse_orders_shopify_order_id ON "public"."warehouse_orders"("shopify_order_id");

-- Add comment
COMMENT ON TABLE "public"."warehouse_orders" IS 'Local cache of ChinaDivision warehouse order data, including PII for cross-referencing.';



