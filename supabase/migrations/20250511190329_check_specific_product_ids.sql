-- Create a function to check specific problematic product IDs
CREATE OR REPLACE FUNCTION check_specific_product_ids()
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
    WITH problematic_ids AS (
        SELECT unnest(ARRAY[
            '8630865789155', '8632555307235', '8632558944483', '8632598757603',
            '8640515145955', '8640638583011', '8643429597411', '8651566121187',
            '8651566416099', '8651566547171', '8651567857891', '8651568349411',
            '8651569201379', '8651569987811', '8651571265763', '8651571626211',
            '8651571855587', '8651574149347', '8651575099619', '8653413974243'
        ]) as product_id
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
    FROM problematic_ids pi
    LEFT JOIN products p ON p.product_id::TEXT = pi.product_id
    LEFT JOIN order_line_items l ON l.product_id::TEXT = pi.product_id
    ORDER BY pi.product_id;
END;
$$ LANGUAGE plpgsql; 