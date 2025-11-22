-- Migration: Preserve edition numbers for authenticated items
-- Once an edition number is scanned and authenticated (nfc_claimed_at IS NOT NULL),
-- it cannot be resequenced

DROP FUNCTION IF EXISTS assign_edition_numbers(TEXT);

CREATE FUNCTION assign_edition_numbers(p_product_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    edition_count INTEGER := 0;
    line_item RECORD;
    v_edition_size INTEGER;
    v_is_open_edition BOOLEAN;
    next_available_number INTEGER := 1;
    used_edition_numbers INTEGER[];
BEGIN
    -- Get the edition_size and check if it's an open edition
    SELECT 
        edition_size,
        (edition_size IS NULL OR edition_size = 0) INTO v_edition_size, v_is_open_edition
    FROM products
    WHERE ("product_id"::text = p_product_id::text OR "product_id"::bigint = p_product_id::bigint);

    -- Get all edition numbers currently used by authenticated items
    SELECT ARRAY_AGG(edition_number) INTO used_edition_numbers
    FROM "public"."order_line_items_v2"
    WHERE ("product_id"::text = p_product_id::text OR "product_id"::bigint = p_product_id::bigint)
    AND status = 'active'
    AND nfc_claimed_at IS NOT NULL
    AND edition_number IS NOT NULL;

    -- If no authenticated items, start from 1, otherwise find max
    IF used_edition_numbers IS NULL OR array_length(used_edition_numbers, 1) IS NULL THEN
        next_available_number := 1;
    ELSE
        SELECT COALESCE(MAX(unnest), 0) + 1 INTO next_available_number
        FROM unnest(used_edition_numbers) AS unnest;
    END IF;

    -- Clear edition numbers ONLY for non-authenticated items
    UPDATE "public"."order_line_items_v2"
    SET edition_number = NULL
    WHERE ("product_id"::text = p_product_id::text OR "product_id"::bigint = p_product_id::bigint)
    AND status = 'active'
    AND nfc_claimed_at IS NULL;  -- Only clear non-authenticated items

    -- Get all active line items for this product, ordered by creation date
    FOR line_item IN 
        SELECT id, created_at, edition_number, nfc_claimed_at
        FROM "public"."order_line_items_v2"
        WHERE ("product_id"::text = p_product_id::text OR "product_id"::bigint = p_product_id::bigint)
        AND status = 'active'
        ORDER BY created_at ASC
    LOOP
        -- Skip authenticated items - they keep their existing edition number
        IF line_item.nfc_claimed_at IS NOT NULL THEN
            CONTINUE;
        END IF;

        -- Find next available number that's not used by authenticated items
        WHILE next_available_number = ANY(used_edition_numbers) LOOP
            next_available_number := next_available_number + 1;
        END LOOP;
        
        -- For limited editions, check if we've exceeded the edition size
        IF NOT v_is_open_edition AND next_available_number > v_edition_size THEN
            RAISE EXCEPTION 'Cannot assign edition number %: exceeds edition size of %', next_available_number, v_edition_size;
        END IF;

        -- Update the line item with its edition number
        UPDATE "public"."order_line_items_v2"
        SET 
            edition_number = next_available_number,
            edition_total = CASE 
                WHEN v_is_open_edition THEN NULL  -- Open editions have no total
                ELSE v_edition_size              -- Limited editions use the edition_size
            END
        WHERE id = line_item.id;

        edition_count := edition_count + 1;
        next_available_number := next_available_number + 1;
    END LOOP;

    RETURN edition_count;
END;
$$;

