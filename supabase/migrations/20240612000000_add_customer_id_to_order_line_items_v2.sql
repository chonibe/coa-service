-- Add customer_id column to order_line_items_v2 table
ALTER TABLE "public"."order_line_items_v2" 
ADD COLUMN "customer_id" UUID REFERENCES auth.users(id);

-- Create an index for faster lookups
CREATE INDEX idx_order_line_items_v2_customer_id 
ON "public"."order_line_items_v2" ("customer_id");

-- Update policy to ensure users can only see their own line items
CREATE POLICY "Enable read access for authenticated users on their own line items" 
ON "public"."order_line_items_v2"
FOR SELECT
USING (auth.uid() = customer_id); 