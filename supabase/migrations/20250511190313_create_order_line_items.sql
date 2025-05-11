-- Drop dependent objects first
DROP TRIGGER IF EXISTS "sync_products_trigger" ON "public"."order_line_items";
DROP FUNCTION IF EXISTS "public"."sync_products"();

-- Drop the existing table if it exists
DROP TABLE IF EXISTS "public"."order_line_items";

-- Create the new table with essential columns
CREATE TABLE "public"."order_line_items" (
    "id" SERIAL PRIMARY KEY,
    "order_id" TEXT NOT NULL,
    "order_name" TEXT,
    "line_item_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" NUMERIC(10,2) NOT NULL,
    "vendor_name" TEXT,
    "fulfillment_status" TEXT,
    "status" TEXT DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_order_line_items_order_id ON "public"."order_line_items" ("order_id");
CREATE INDEX idx_order_line_items_product_id ON "public"."order_line_items" ("product_id");
CREATE INDEX idx_order_line_items_line_item_id ON "public"."order_line_items" ("line_item_id");

-- Add RLS policies
ALTER TABLE "public"."order_line_items" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON "public"."order_line_items"
    FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."order_line_items"
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON "public"."order_line_items"
    FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON "public"."order_line_items"
    FOR DELETE
    USING (auth.role() = 'authenticated'); 