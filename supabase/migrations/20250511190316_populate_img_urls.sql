-- First, let's see what we're working with
DO $$
BEGIN
    -- Log the count of records we're about to update
    RAISE NOTICE 'Starting img_url population...';
    
    -- Update the records
    UPDATE "public"."order_line_items" oli
    SET img_url = p.image_url
    FROM "public"."products" p
    WHERE oli.product_id::text = p.id::text
    AND oli.img_url IS NULL
    AND p.image_url IS NOT NULL;
    
    -- Log the results
    RAISE NOTICE 'Update completed';
END $$; 