-- Migration: Final Type Fix for assign_edition_numbers
-- Fixes "character varying = integer" error by correctly handling edition_size as text

CREATE OR REPLACE FUNCTION assign_edition_numbers(p_product_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    edition_count INTEGER := 0;
    line_item RECORD;
    v_edition_size_text TEXT;
    v_edition_size_int INTEGER;
    v_is_open_edition BOOLEAN;
    next_available_number INTEGER := 1;
    used_edition_numbers INTEGER[];
    v_order_customer_email TEXT;
BEGIN
    -- Get the edition_size as text first
    SELECT 
        edition_size INTO v_edition_size_text
    FROM products
    WHERE product_id::TEXT = p_product_id::TEXT;

    -- Determine if it's an open edition
    v_is_open_edition := (v_edition_size_text IS NULL OR v_edition_size_text = '' OR v_edition_size_text = '0');
    
    -- Convert to integer for comparison if not open edition
    IF NOT v_is_open_edition THEN
        v_edition_size_int := v_edition_size_text::INTEGER;
    ELSE
        v_edition_size_int := NULL;
    END IF;

    -- Get all edition numbers currently used by authenticated items (preserve these)
    SELECT ARRAY_AGG(edition_number) INTO used_edition_numbers
    FROM "public"."order_line_items_v2"
    WHERE product_id::TEXT = p_product_id::TEXT
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
    UPDATE "public"."order_line_items_v2"
    SET edition_number = NULL
    WHERE product_id::TEXT = p_product_id::TEXT
    AND status = 'active'
    AND nfc_claimed_at IS NULL;

    -- Get all active line items for this product, ordered by creation date
    FOR line_item IN 
        SELECT id, order_id::TEXT as order_id_text, line_item_id, created_at, nfc_claimed_at, edition_number, owner_name, owner_email, fulfillment_status, status
        FROM "public"."order_line_items_v2"
        WHERE product_id::TEXT = p_product_id::TEXT
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
        IF NOT v_is_open_edition AND next_available_number > v_edition_size_int THEN
            RAISE EXCEPTION 'Cannot assign edition number %: exceeds edition size of %', next_available_number, v_edition_size_int;
        END IF;

        -- Try to get owner email from orders table if not present in line item
        v_order_customer_email := line_item.owner_email;
        IF v_order_customer_email IS NULL OR v_order_customer_email = '' THEN
            SELECT customer_email INTO v_order_customer_email
            FROM orders
            WHERE id::TEXT = line_item.order_id_text;
        END IF;

        -- Update the line item with its edition number and owner info
        BEGIN
            UPDATE "public"."order_line_items_v2"
            SET 
                edition_number = next_available_number,
                owner_email = COALESCE(owner_email, v_order_customer_email),
                edition_total = v_edition_size_int
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

