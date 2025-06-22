-- Add img_url column to order_line_items table
ALTER TABLE "public"."order_line_items"
ADD COLUMN IF NOT EXISTS "img_url" TEXT;

-- Update existing records with img_url from products table
UPDATE "public"."order_line_items" oli
SET img_url = p.image_url
FROM "public"."products" p
WHERE oli.product_id::text = p.id::text
AND oli.img_url IS NULL; 