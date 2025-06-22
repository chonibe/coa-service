-- Add foreign key constraint for order_id in order_line_items
ALTER TABLE "public"."order_line_items"
ALTER COLUMN order_id TYPE TEXT;

-- Add foreign key constraint
ALTER TABLE "public"."order_line_items"
ADD CONSTRAINT fk_order_line_items_order_id
FOREIGN KEY (order_id)
REFERENCES "public"."orders"(id)
ON DELETE CASCADE;

-- Add index for better join performance
CREATE INDEX IF NOT EXISTS idx_order_line_items_order_id 
ON "public"."order_line_items"(order_id); 