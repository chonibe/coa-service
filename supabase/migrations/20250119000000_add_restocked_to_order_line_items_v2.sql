-- Add restocked column to order_line_items_v2
ALTER TABLE "public"."order_line_items_v2" 
ADD COLUMN IF NOT EXISTS "restocked" BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster queries filtering restocked items
CREATE INDEX IF NOT EXISTS idx_order_line_items_v2_restocked ON "public"."order_line_items_v2" ("restocked") WHERE "restocked" = true;

-- Add comment
COMMENT ON COLUMN "public"."order_line_items_v2"."restocked" IS 'Indicates if this line item was restocked (returned to inventory)';

