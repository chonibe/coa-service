-- Migration: Backfill Owner Info in assign_edition_numbers
-- Updates function to automatically link owner info from orders table

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
    -- Get the edition_size and check if it's an open edition
    SELECT 
        edition_size,
        (edition_size IS NULL OR edition_size = 0) INTO v_edition_size, v_is_open_edition
    FROM products
    WHERE "product_id"::text = p_product_id::text;

    -- Get all edition numbers currently used by authenticated items (preserve these)
    SELECT ARRAY_AGG(edition_number) INTO used_edition_numbers
    FROM "public"."order_line_items_v2"
    WHERE "product_id"::text = p_product_id::text
    AND status = 'active'
    AND nfc_claimed_at IS NOT NULL
    AND edition_number IS NOT NULL;

    -- If no authenticated items, start from 1, otherwise find next available
    IF used_edition_numbers IS NULL OR array_length(used_edition_numbers, 1) IS NULL THEN
        next_available_number := 1;
    ELSE
        -- Find the next available number that's not in the used list
        WHILE next_available_number = ANY(used_edition_numbers) LOOP
            next_available_number := next_available_number + 1;
        END LOOP;
    END IF;

    -- Only clear edition numbers for non-authenticated items
    -- Preserve edition numbers for authenticated items
    UPDATE "public"."order_line_items_v2"
    SET edition_number = NULL
    WHERE "product_id"::text = p_product_id::text
    AND status = 'active'
    AND nfc_claimed_at IS NULL;

    -- Get all active line items for this product, ordered by creation date
    FOR line_item IN 
        SELECT id, order_id, line_item_id, created_at, nfc_claimed_at, edition_number, owner_name, owner_email, fulfillment_status, status
        FROM "public"."order_line_items_v2"
        WHERE "product_id"::text = p_product_id::text
        AND status = 'active'
        ORDER BY created_at ASC
    LOOP
        -- Skip if this item is already authenticated (preserve its edition number)
        IF line_item.nfc_claimed_at IS NOT NULL AND line_item.edition_number IS NOT NULL THEN
            CONTINUE;
        END IF;
        
        -- Find next available number that's not used by authenticated items
        WHILE next_available_number = ANY(COALESCE(used_edition_numbers, ARRAY[]::INTEGER[])) LOOP
            next_available_number := next_available_number + 1;
        END LOOP;
        
        -- For limited editions, check if we've exceeded the edition size
        IF NOT v_is_open_edition AND next_available_number > v_edition_size THEN
            RAISE EXCEPTION 'Cannot assign edition number %: exceeds edition size of %', next_available_number, v_edition_size;
        END IF;

        -- Try to get owner email from orders table if not present in line item
        v_order_customer_email := line_item.owner_email;
        IF v_order_customer_email IS NULL OR v_order_customer_email = '' THEN
            SELECT customer_email INTO v_order_customer_email
            FROM orders
            WHERE id = line_item.order_id;
        END IF;

        -- Update the line item with its edition number and owner info
        -- Use ON CONFLICT to handle uniqueness constraint gracefully
        BEGIN
            UPDATE "public"."order_line_items_v2"
            SET 
                edition_number = next_available_number,
                owner_email = COALESCE(owner_email, v_order_customer_email),
                edition_total = CASE 
                    WHEN v_is_open_edition THEN NULL  -- Open editions have no total
                    ELSE v_edition_size              -- Limited editions use the edition_size
                END
            WHERE id = line_item.id;
            
            edition_count := edition_count + 1;
            next_available_number := next_available_number + 1;
        EXCEPTION
            WHEN unique_violation THEN
                -- If uniqueness constraint violation, skip this number and try next
                next_available_number := next_available_number + 1;
                CONTINUE;
        END;
    END LOOP;

    RETURN edition_count;
END;
$$;

