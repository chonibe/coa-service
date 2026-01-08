-- Migration: Ultra Defensive Type Handling in assign_edition_numbers
-- Casts all ID comparisons to text to avoid type mismatch errors

CREATE OR REPLACE FUNCTION assign_edition_numbers(p_product_id TEXT)
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
    v_order_customer_email TEXT;
BEGIN
    -- 1. Get product info
    SELECT 
        edition_size,
        (edition_size IS NULL OR edition_size = 0) INTO v_edition_size, v_is_open_edition
    FROM products
    WHERE product_id::text = p_product_id::text;

    -- 2. Get used numbers (preserving authenticated ones)
    SELECT ARRAY_AGG(edition_number) INTO used_edition_numbers
    FROM "public"."order_line_items_v2"
    WHERE product_id::text = p_product_id::text
    AND status = 'active'
    AND nfc_claimed_at IS NOT NULL
    AND edition_number IS NOT NULL;

    -- 3. Clear existing non-authenticated numbers
    UPDATE "public"."order_line_items_v2"
    SET edition_number = NULL
    WHERE product_id::text = p_product_id::text
    AND status = 'active'
    AND nfc_claimed_at IS NULL;

    -- 4. Process all active items
    FOR line_item IN 
        SELECT id, order_id, line_item_id, created_at, nfc_claimed_at, edition_number, owner_name, owner_email, fulfillment_status, status
        FROM "public"."order_line_items_v2"
        WHERE product_id::text = p_product_id::text
        AND status = 'active'
        ORDER BY created_at ASC
    LOOP
        -- Skip authenticated
        IF line_item.nfc_claimed_at IS NOT NULL AND line_item.edition_number IS NOT NULL THEN
            CONTINUE;
        END IF;
        
        -- Find next number
        WHILE next_available_number = ANY(COALESCE(used_edition_numbers, ARRAY[]::INTEGER[])) LOOP
            next_available_number := next_available_number + 1;
        END LOOP;
        
        -- Limits
        IF NOT v_is_open_edition AND next_available_number > v_edition_size THEN
            RAISE EXCEPTION 'Cannot assign edition number %: exceeds edition size of %', next_available_number, v_edition_size;
        END IF;

        -- BACKFILL OWNER INFO
        v_order_customer_email := line_item.owner_email;
        IF v_order_customer_email IS NULL OR v_order_customer_email = '' THEN
            -- Using text casting for the join/lookup
            SELECT customer_email INTO v_order_customer_email
            FROM orders
            WHERE id::text = line_item.order_id::text;
        END IF;

        -- Update
        BEGIN
            UPDATE "public"."order_line_items_v2"
            SET 
                edition_number = next_available_number,
                owner_email = COALESCE(owner_email, v_order_customer_email),
                edition_total = CASE 
                    WHEN v_is_open_edition THEN NULL
                    ELSE v_edition_size
                END
            WHERE id = line_item.id;
            
            edition_count := edition_count + 1;
            next_available_number := next_available_number + 1;
        EXCEPTION
            WHEN unique_violation THEN
                next_available_number := next_available_number + 1;
                CONTINUE;
        END;
    END LOOP;

    RETURN edition_count;
END;
$$;

