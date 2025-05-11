-- Create a function to check product_id types and values
CREATE OR REPLACE FUNCTION check_product_id_types()
RETURNS TABLE (
    product_id TEXT,
    products_type TEXT,
    products_value TEXT,
    line_items_type TEXT,
    line_items_value TEXT,
    has_mismatch BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH product_ids AS (
        SELECT DISTINCT p.product_id::TEXT as product_id
        FROM products p
        UNION
        SELECT DISTINCT l.product_id::TEXT as product_id
        FROM order_line_items_v2 l
    )
    SELECT 
        pi.product_id,
        pg_typeof(p.product_id)::TEXT as products_type,
        p.product_id::TEXT as products_value,
        pg_typeof(l.product_id)::TEXT as line_items_type,
        l.product_id::TEXT as line_items_value,
        CASE 
            WHEN pg_typeof(p.product_id) != pg_typeof(l.product_id) THEN true
            ELSE false
        END as has_mismatch
    FROM product_ids pi
    LEFT JOIN products p ON p.product_id::TEXT = pi.product_id
    LEFT JOIN order_line_items_v2 l ON l.product_id::TEXT = pi.product_id
    WHERE p.product_id IS NOT NULL OR l.product_id IS NOT NULL
    ORDER BY pi.product_id;
END;
$$ LANGUAGE plpgsql; 