-- Add customer_id column to order_line_items_v2 table
-- Check if column exists first to avoid errors
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'order_line_items_v2' 
        AND column_name = 'customer_id'
    ) THEN
        ALTER TABLE "public"."order_line_items_v2"
        ADD COLUMN "customer_id" UUID REFERENCES auth.users(id);
    END IF;
END $$;;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_order_line_items_v2_customer_id 
ON "public"."order_line_items_v2" ("customer_id");

-- Update policy to ensure users can only see their own line items
DROP POLICY IF EXISTS "Enable read access for authenticated users on their own line items" ON "public"."order_line_items_v2";
CREATE POLICY "Enable read access for authenticated users on their own line items" 
ON "public"."order_line_items_v2"
FOR SELECT
USING (auth.uid() = customer_id); 