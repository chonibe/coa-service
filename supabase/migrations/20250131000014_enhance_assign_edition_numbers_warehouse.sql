-- Migration: Enhance assign_edition_numbers with warehouse cache lookup

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
    v_owner_email TEXT;
    v_owner_name TEXT;
    v_shopify_customer_id TEXT;
    v_order_name TEXT;
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

    -- Find start number
    IF used_edition_numbers IS NULL OR array_length(used_edition_numbers, 1) IS NULL THEN
        next_available_number := 1;
    ELSE
        WHILE next_available_number = ANY(used_edition_numbers) LOOP
            next_available_number := next_available_number + 1;
        END LOOP;
    END IF;

    -- Reset numbers for non-authenticated
    UPDATE "public"."order_line_items_v2"
    SET edition_number = NULL
    WHERE product_id::TEXT = p_product_id::TEXT
    AND status = 'active'
    AND nfc_claimed_at IS NULL;

    FOR line_item IN 
        SELECT li.id, li.order_id::TEXT as order_id_text, li.line_item_id, li.created_at, li.nfc_claimed_at, li.edition_number, li.owner_name, li.owner_email, li.customer_id, o.order_name
        FROM "public"."order_line_items_v2" li
        LEFT JOIN "public"."orders" o ON o.id::TEXT = li.order_id::TEXT
        WHERE li.product_id::TEXT = p_product_id::TEXT
        AND li.status = 'active'
        ORDER BY li.created_at ASC
    LOOP
        IF line_item.nfc_claimed_at IS NOT NULL AND line_item.edition_number IS NOT NULL THEN
            CONTINUE;
        END IF;
        
        WHILE next_available_number = ANY(COALESCE(used_edition_numbers, ARRAY[]::INTEGER[])) LOOP
            next_available_number := next_available_number + 1;
        END LOOP;
        
        IF NOT v_is_open_edition AND next_available_number > v_edition_size_int THEN
            RAISE EXCEPTION 'Cannot assign edition number %: exceeds edition size of %', next_available_number, v_edition_size_int;
        END IF;

        -- Linkage Logic: Try to find owner PII
        v_owner_email := line_item.owner_email;
        v_owner_name := line_item.owner_name;
        v_shopify_customer_id := line_item.customer_id;

        -- 1. Check Orders table
        IF v_owner_email IS NULL OR v_owner_email = '' THEN
            SELECT customer_email, customer_id INTO v_owner_email, v_shopify_customer_id
            FROM orders
            WHERE id::TEXT = line_item.order_id_text;
        END IF;

        -- 2. Check Warehouse cache
        IF v_owner_email IS NULL OR v_owner_email = '' OR v_owner_name IS NULL OR v_owner_name = '' THEN
            DECLARE
                wh_email TEXT;
                wh_name TEXT;
                wh_shopify_id TEXT;
            BEGIN
                SELECT ship_email, ship_name, shopify_order_id INTO wh_email, wh_name, wh_shopify_id
                FROM warehouse_orders
                WHERE order_id = line_item.order_name OR id = line_item.order_name OR shopify_order_id = line_item.order_id_text
                LIMIT 1;
                
                IF wh_email IS NOT NULL THEN
                    v_owner_email := COALESCE(v_owner_email, wh_email);
                    v_owner_name := COALESCE(v_owner_name, wh_name);
                END IF;
            END;
        END IF;

        BEGIN
            UPDATE "public"."order_line_items_v2"
            SET 
                edition_number = next_available_number,
                owner_email = v_owner_email,
                owner_name = v_owner_name,
                customer_id = v_shopify_customer_id,
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



