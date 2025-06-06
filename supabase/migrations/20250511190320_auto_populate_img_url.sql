-- Create a function to automatically populate img_url from products table
CREATE OR REPLACE FUNCTION populate_img_url()
RETURNS TRIGGER AS $$
BEGIN
    -- Update img_url from products table
    UPDATE order_line_items_v2
    SET img_url = p.image_url
    FROM products p
    WHERE order_line_items_v2.product_id = p.product_id
    AND order_line_items_v2.id = NEW.id
    AND p.image_url IS NOT NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to run the function after insert
DROP TRIGGER IF EXISTS auto_populate_img_url ON order_line_items_v2;
CREATE TRIGGER auto_populate_img_url
    AFTER INSERT ON order_line_items_v2
    FOR EACH ROW
    EXECUTE FUNCTION populate_img_url(); 