-- Add foreign key constraint for order_id in order_line_items_v2
ALTER TABLE "public"."order_line_items_v2"
ALTER COLUMN order_id TYPE TEXT;

-- Add foreign key constraint
ALTER TABLE "public"."order_line_items_v2"
ADD CONSTRAINT fk_order_line_items_v2_order_id
FOREIGN KEY (order_id)
REFERENCES "public"."orders"(id)
ON DELETE CASCADE;

-- Add index for better join performance
CREATE INDEX IF NOT EXISTS idx_order_line_items_v2_order_id 
ON "public"."order_line_items_v2"(order_id); 