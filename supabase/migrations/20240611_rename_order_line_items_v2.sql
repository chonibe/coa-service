-- Rename order_line_items_v2 to order_line_items
BEGIN;

-- Drop existing indexes
DROP INDEX IF EXISTS idx_order_line_items_v2_order_id;
DROP INDEX IF EXISTS idx_order_line_items_v2_product_id;
DROP INDEX IF EXISTS idx_order_line_items_v2_line_item_id;
DROP INDEX IF EXISTS idx_order_line_items_v2_nfc_tag_id;
DROP INDEX IF EXISTS idx_order_line_items_v2_nfc_pairing_status;
DROP INDEX IF EXISTS idx_order_line_items_v2_customer_id;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."order_line_items_v2";
DROP POLICY IF EXISTS "Enable insert for authenticated users and service role" ON "public"."order_line_items_v2";
DROP POLICY IF EXISTS "Enable update for authenticated users and service role" ON "public"."order_line_items_v2";
DROP POLICY IF EXISTS "Enable delete for authenticated users and service role" ON "public"."order_line_items_v2";

-- Rename the table
ALTER TABLE "public"."order_line_items_v2" RENAME TO "order_line_items";

-- Recreate indexes with new table name
CREATE INDEX idx_order_line_items_order_id ON "public"."order_line_items" ("order_id");
CREATE INDEX idx_order_line_items_product_id ON "public"."order_line_items" ("product_id");
CREATE INDEX idx_order_line_items_line_item_id ON "public"."order_line_items" ("line_item_id");
CREATE INDEX idx_order_line_items_nfc_tag_id ON "public"."order_line_items" ("nfc_tag_id");
CREATE INDEX idx_order_line_items_nfc_pairing_status ON "public"."order_line_items" ("nfc_pairing_status");
CREATE INDEX idx_order_line_items_customer_id ON "public"."order_line_items" ("customer_id");

-- Recreate policies
CREATE POLICY "Enable read access for all users" ON "public"."order_line_items"
    FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users and service role" ON "public"."order_line_items"
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "Enable update for authenticated users and service role" ON "public"."order_line_items"
    FOR UPDATE
    USING (
        auth.role() = 'authenticated' OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "Enable delete for authenticated users and service role" ON "public"."order_line_items"
    FOR DELETE
    USING (
        auth.role() = 'authenticated' OR 
        auth.role() = 'service_role'
    );

-- Enable row-level security
ALTER TABLE "public"."order_line_items" ENABLE ROW LEVEL SECURITY;

COMMIT; 