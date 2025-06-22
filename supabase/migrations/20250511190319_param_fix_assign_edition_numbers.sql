-- Drop the function if it exists
DROP FUNCTION IF EXISTS assign_edition_numbers(TEXT);

-- Recreate the function with a non-ambiguous parameter name
CREATE FUNCTION assign_edition_numbers(p_product_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    edition_count INTEGER := 0;
    line_item RECORD;
BEGIN
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
        -- Update the line item with its edition number
        UPDATE "public"."order_line_items"
        SET edition_number = edition_count
        WHERE id = line_item.id;
    END LOOP;

    -- Update the edition_total for all line items of this product
    UPDATE "public"."order_line_items"
    SET edition_total = edition_count
    WHERE "product_id" = p_product_id;

    RETURN edition_count;
END;
$$; 