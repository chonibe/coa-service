-- Drop the function if it exists
DROP FUNCTION IF EXISTS assign_edition_numbers(TEXT);

-- Recreate the function to use edition_size from products table
CREATE FUNCTION assign_edition_numbers(p_product_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    edition_count INTEGER := 0;
    line_item RECORD;
    v_edition_total INTEGER;
BEGIN
    -- Get the edition_size from products table
    SELECT edition_size INTO v_edition_total
    FROM products
    WHERE product_id = p_product_id;

    IF v_edition_total IS NULL THEN
        RAISE EXCEPTION 'Product % does not have an edition_size set', p_product_id;
    END IF;

    -- Clear any existing edition numbers for this product
    UPDATE "public"."order_line_items"
    SET edition_number = NULL
    WHERE "product_id" = p_product_id;

    -- Get all active line items for this product, ordered by creation date
    FOR line_item IN 
        SELECT id, created_at
        FROM "public"."order_line_items"
        WHERE "product_id" = p_product_id
        AND status = 'active'
        ORDER BY created_at ASC
    LOOP
        edition_count := edition_count + 1;
        
        -- Check if we've exceeded the edition size
        IF edition_count > v_edition_total THEN
            RAISE EXCEPTION 'Cannot assign edition number %: exceeds edition size of %', edition_count, v_edition_total;
        END IF;

        -- Update the line item with its edition number
        UPDATE "public"."order_line_items"
        SET 
            edition_number = edition_count,
            edition_total = v_edition_total
        WHERE id = line_item.id;
    END LOOP;

    RETURN edition_count;
END;
$$; 