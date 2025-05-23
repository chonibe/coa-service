CREATE TABLE "public"."order_line_items_v2" (
    "id" SERIAL PRIMARY KEY,
    "order_id" TEXT NOT NULL,
    "order_name" TEXT,
    "line_item_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" NUMERIC(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "sku" TEXT,
    "vendor_name" TEXT,
    "fulfillment_status" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_line_items_v2_order_id ON "public"."order_line_items_v2" ("order_id");
CREATE INDEX idx_order_line_items_v2_product_id ON "public"."order_line_items_v2" ("product_id");
CREATE INDEX idx_order_line_items_v2_line_item_id ON "public"."order_line_items_v2" ("line_item_id");

ALTER TABLE "public"."order_line_items_v2" ENABLE ROW LEVEL SECURITY;

-- Allow read access for all users
CREATE POLICY "Enable read access for all users" ON "public"."order_line_items_v2"
    FOR SELECT
    USING (true);

-- Allow insert for authenticated users and service role
CREATE POLICY "Enable insert for authenticated users and service role" ON "public"."order_line_items_v2"
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' OR 
        auth.role() = 'service_role'
    );

-- Allow update for authenticated users and service role
CREATE POLICY "Enable update for authenticated users and service role" ON "public"."order_line_items_v2"
    FOR UPDATE
    USING (
        auth.role() = 'authenticated' OR 
        auth.role() = 'service_role'
    );

-- Allow delete for authenticated users and service role
CREATE POLICY "Enable delete for authenticated users and service role" ON "public"."order_line_items_v2"
    FOR DELETE
    USING (
        auth.role() = 'authenticated' OR 
        auth.role() = 'service_role'
    ); 