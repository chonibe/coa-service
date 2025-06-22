-- Debug information about the tables
DO $$
DECLARE
    oli_count INTEGER;
    products_count INTEGER;
    match_count INTEGER;
BEGIN
    -- Count records in both tables
    SELECT COUNT(*) INTO oli_count FROM order_line_items;
    SELECT COUNT(*) INTO products_count FROM products;
    
    -- Count matching records
    SELECT COUNT(*) INTO match_count 
    FROM order_line_items oli
    JOIN products p ON oli.product_id = p.product_id
    WHERE oli.img_url IS NULL
    AND p.image_url IS NOT NULL;
    
    -- Log the counts
    RAISE NOTICE 'Total order_line_items records: %', oli_count;
    RAISE NOTICE 'Total products records: %', products_count;
    RAISE NOTICE 'Matching records to update: %', match_count;
    
    -- Update the records
    UPDATE order_line_items oli
    SET img_url = p.image_url
    FROM products p
    WHERE oli.product_id = p.product_id
    AND oli.img_url IS NULL
    AND p.image_url IS NOT NULL;
    
    -- Log the number of rows updated
    RAISE NOTICE 'Rows updated: %', match_count;
END $$; 