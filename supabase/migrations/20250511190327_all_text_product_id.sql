-- Drop the function if it exists
DROP FUNCTION IF EXISTS assign_edition_numbers(TEXT);

-- Recreate the function with all product_id comparisons as TEXT
CREATE FUNCTION assign_edition_numbers(p_product_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    edition_count INTEGER := 0;
    line_item RECORD;
    v_edition_size INTEGER;
    v_is_open_edition BOOLEAN;
BEGIN
    -- Get the edition_size and check if it's an open edition
    SELECT 
        edition_size,
        (edition_size IS NULL OR edition_size = 0) INTO v_edition_size, v_is_open_edition
    FROM products
    WHERE "product_id"::TEXT = p_product_id;

    -- Clear any existing edition numbers for this product
    UPDATE "public"."order_line_items_v2"
    SET edition_number = NULL
    WHERE "product_id"::TEXT = p_product_id;

    -- Get all active line items for this product, ordered by creation date
    FOR line_item IN 
        SELECT id, created_at
        FROM "public"."order_line_items_v2"
        WHERE "product_id"::TEXT = p_product_id
        AND status = 'active'
        ORDER BY created_at ASC
    LOOP
        edition_count := edition_count + 1;
        
        -- For limited editions, check if we've exceeded the edition size
        IF NOT v_is_open_edition AND edition_count > v_edition_size THEN
            RAISE EXCEPTION 'Cannot assign edition number %: exceeds edition size of %', edition_count, v_edition_size;
        END IF;

        -- Update the line item with its edition number
        UPDATE "public"."order_line_items_v2"
        SET 
            edition_number = edition_count,
            edition_total = CASE 
                WHEN v_is_open_edition THEN NULL  -- Open editions have no total
                ELSE v_edition_size              -- Limited editions use the edition_size
            END
        WHERE id = line_item.id;
    END LOOP;

    RETURN edition_count;
END;
$$; 