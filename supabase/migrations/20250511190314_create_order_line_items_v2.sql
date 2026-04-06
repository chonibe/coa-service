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
    "vendor_name" TEXT,
    "fulfillment_status" TEXT,
    "status" TEXT DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_order_line_items_v2_order_id ON "public"."order_line_items_v2" ("order_id");
CREATE INDEX idx_order_line_items_v2_product_id ON "public"."order_line_items_v2" ("product_id");
CREATE INDEX idx_order_line_items_v2_line_item_id ON "public"."order_line_items_v2" ("line_item_id");
ALTER TABLE "public"."order_line_items_v2" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON "public"."order_line_items_v2"
    FOR SELECT
    USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON "public"."order_line_items_v2"
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON "public"."order_line_items_v2"
    FOR UPDATE
    USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON "public"."order_line_items_v2"
    FOR DELETE
    USING (auth.role() = 'authenticated');
