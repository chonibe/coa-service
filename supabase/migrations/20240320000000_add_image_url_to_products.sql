-- Add image_url column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update existing products with image URLs from Shopify
UPDATE products
SET image_url = (
  SELECT images->0->>'src'
  FROM shopify_products
  WHERE shopify_products.id = products.product_id::bigint
)
WHERE image_url IS NULL; 