-- Migration: Fix assign_edition_numbers FK violation and update logic
-- This ensures that customer_id (UUID) is only set if a valid Supabase user is found.
-- It also correctly populates shopify_customer_id (TEXT).

CREATE OR REPLACE FUNCTION assign_edition_numbers(p_product_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER -- Required to access auth.users if needed
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
    v_supabase_user_id UUID;
    v_order_name TEXT;
BEGIN
    -- 1. Get the edition_size from products
    SELECT 
        edition_size INTO v_edition_size_text
    FROM products
    WHERE product_id::TEXT = p_product_id::TEXT;

    -- Determine if it's an open edition
    v_is_open_edition := (v_edition_size_text IS NULL OR v_edition_size_text = '' OR v_edition_size_text = '0');
    
    -- Convert to integer if not open edition
    IF NOT v_is_open_edition THEN
        BEGIN
            v_edition_size_int := v_edition_size_text::INTEGER;
        EXCEPTION WHEN others THEN
            v_is_open_edition := TRUE;
            v_edition_size_int := NULL;
        END;
    ELSE
        v_edition_size_int := NULL;
    END IF;

    -- 2. Preserve edition numbers for claimed/authenticated items
    SELECT ARRAY_AGG(edition_number) INTO used_edition_numbers
    FROM "public"."order_line_items_v2"
    WHERE product_id::TEXT = p_product_id::TEXT
    AND status = 'active'
    AND nfc_claimed_at IS NOT NULL
    AND edition_number IS NOT NULL;

    -- 3. Reset numbers for non-authenticated (starting fresh for them)
    UPDATE "public"."order_line_items_v2"
    SET edition_number = NULL
    WHERE product_id::TEXT = p_product_id::TEXT
    AND status = 'active'
    AND nfc_claimed_at IS NULL;

    -- 4. Process all active items in chronological order
    FOR line_item IN 
        SELECT li.id, li.order_id::TEXT as order_id_text, li.line_item_id, li.created_at, li.nfc_claimed_at, li.edition_number, li.owner_name, li.owner_email, li.shopify_customer_id, li.owner_id, o.order_name
        FROM "public"."order_line_items_v2" li
        LEFT JOIN "public"."orders" o ON o.id::TEXT = li.order_id::TEXT
        WHERE li.product_id::TEXT = p_product_id::TEXT
        AND li.status = 'active'
        ORDER BY li.created_at ASC
    LOOP
        -- Skip items that already have a preserved edition number (claimed)
        IF line_item.nfc_claimed_at IS NOT NULL AND line_item.edition_number IS NOT NULL THEN
            edition_count := edition_count + 1;
            CONTINUE;
        END IF;
        
        -- Find next available gap in numbering
        WHILE next_available_number = ANY(COALESCE(used_edition_numbers, ARRAY[]::INTEGER[])) LOOP
            next_available_number := next_available_number + 1;
        END LOOP;
        
        -- Safety check for edition size
        IF NOT v_is_open_edition AND next_available_number > v_edition_size_int THEN
            -- Instead of failing the whole thing, we just stop assigning for this product
            EXIT; 
        END IF;

        -- Linkage Logic: Recover PII
        v_owner_email := line_item.owner_email;
        v_owner_name := line_item.owner_name;
        v_shopify_customer_id := line_item.shopify_customer_id;
        v_supabase_user_id := line_item.owner_id;

        -- A. Check Orders table for missing PII
        IF v_owner_email IS NULL OR v_owner_email = '' THEN
            SELECT customer_email, customer_id INTO v_owner_email, v_shopify_customer_id
            FROM orders
            WHERE id::TEXT = line_item.order_id_text;
        END IF;

        -- B. Check Warehouse cache for missing PII
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
                    v_shopify_customer_id := COALESCE(v_shopify_customer_id, wh_shopify_id);
                END IF;
            END;
        END IF;

        -- C. Attempt to find Supabase User ID by email if we don't have it
        IF v_supabase_user_id IS NULL AND v_owner_email IS NOT NULL THEN
            -- Check auth.users safely
            SELECT id INTO v_supabase_user_id
            FROM auth.users
            WHERE email = LOWER(v_owner_email)
            LIMIT 1;
        END IF;

        -- D. Perform Update
        UPDATE "public"."order_line_items_v2"
        SET 
            edition_number = next_available_number,
            owner_email = LOWER(v_owner_email),
            owner_name = v_owner_name,
            shopify_customer_id = v_shopify_customer_id,
            owner_id = v_supabase_user_id,
            customer_id = v_supabase_user_id, -- Link to auth.user if exists
            edition_total = v_edition_size_int,
            updated_at = NOW()
        WHERE id = line_item.id;
        
        edition_count := edition_count + 1;
        next_available_number := next_available_number + 1;
    END LOOP;

    RETURN edition_count;
END;
$$;

