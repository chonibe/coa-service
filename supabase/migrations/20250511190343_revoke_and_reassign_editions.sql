CREATE OR REPLACE FUNCTION revoke_and_reassign_editions(p_line_item_id BIGINT)
RETURNS VOID AS $$
DECLARE
    v_product_id BIGINT;
    v_edition_size BIGINT;
    v_is_limited BOOLEAN;
BEGIN
    -- Get the product_id and edition info for this line item
    SELECT 
        oli.product_id,
        p.edition_size,
        p.edition_size IS NOT NULL
    INTO 
        v_product_id,
        v_edition_size,
        v_is_limited
    FROM order_line_items_v2 oli
    JOIN products p ON p.product_id = oli.product_id
    WHERE oli.id = p_line_item_id;

    -- Revoke the edition number for the specified line item
    UPDATE order_line_items_v2
    SET edition_number = NULL,
        edition_total = NULL
    WHERE id = p_line_item_id;

    -- Reassign edition numbers to remaining line items based on timestamp
    WITH numbered_items AS (
        SELECT 
            id,
            ROW_NUMBER() OVER (ORDER BY created_at) as new_number
        FROM order_line_items_v2
        WHERE product_id = v_product_id
        AND edition_number IS NULL
        AND id != p_line_item_id
    )
    UPDATE order_line_items_v2 oli
    SET 
        edition_number = ni.new_number,
        edition_total = CASE 
            WHEN v_is_limited THEN v_edition_size 
            ELSE NULL 
        END
    FROM numbered_items ni
    WHERE oli.id = ni.id;

    -- The trigger we created earlier will automatically update the edition_counter
    -- in the products table
END;
$$ LANGUAGE plpgsql; 