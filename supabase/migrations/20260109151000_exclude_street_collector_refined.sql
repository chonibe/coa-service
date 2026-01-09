-- Migration: Exclude Street Collector from edition numbers and fix FK violations
-- Street Collector items (shipping protection, kits, etc.) should not receive edition numbers.
-- This update ensures that both previous protocols (Street Collector exclusion) and new fixes (FK safety) are combined.

CREATE OR REPLACE FUNCTION assign_edition_numbers(p_product_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER -- Required to access auth.users
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
BEGIN
    -- 1. Get the edition_size from products
    SELECT 
        edition_size INTO v_edition_size_text
    FROM products
    WHERE product_id::TEXT = p_product_id::TEXT;

    v_is_open_edition := (v_edition_size_text IS NULL OR v_edition_size_text = '' OR v_edition_size_text = '0');
    
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
    -- BUT EXCLUDE Street Collector (they should never have edition numbers)
    SELECT ARRAY_AGG(edition_number) INTO used_edition_numbers
    FROM "public"."order_line_items_v2"
    WHERE product_id::TEXT = p_product_id::TEXT
    AND status = 'active'
    AND nfc_claimed_at IS NOT NULL
    AND edition_number IS NOT NULL
    AND LOWER(COALESCE(vendor_name, '')) NOT IN ('street collector', 'street-collector');

    -- 3. Reset numbers for non-authenticated OR Street Collector items
    UPDATE "public"."order_line_items_v2"
    SET edition_number = NULL,
        edition_total = NULL
    WHERE product_id::TEXT = p_product_id::TEXT
    AND status = 'active'
    AND (
        nfc_claimed_at IS NULL 
        OR LOWER(COALESCE(vendor_name, '')) IN ('street collector', 'street-collector')
    );

    -- 4. Process all active non-Street Collector items in chronological order
    FOR line_item IN 
        SELECT li.id, li.order_id::TEXT as order_id_text, li.line_item_id, li.created_at, li.nfc_claimed_at, li.edition_number, li.owner_name, li.owner_email, li.shopify_customer_id, li.owner_id, li.vendor_name, o.order_name
        FROM "public"."order_line_items_v2" li
        LEFT JOIN "public"."orders" o ON o.id::TEXT = li.order_id::TEXT
        WHERE li.product_id::TEXT = p_product_id::TEXT
        AND li.status = 'active'
        AND LOWER(COALESCE(li.vendor_name, '')) NOT IN ('street collector', 'street-collector')
        ORDER BY li.created_at ASC
    LOOP
        -- Skip if already claimed and has number
        IF line_item.nfc_claimed_at IS NOT NULL AND line_item.edition_number IS NOT NULL THEN
            edition_count := edition_count + 1;
            CONTINUE;
        END IF;
        
        -- Find next available number
        WHILE next_available_number = ANY(COALESCE(used_edition_numbers, ARRAY[]::INTEGER[])) LOOP
            next_available_number := next_available_number + 1;
        END LOOP;
        
        -- Cap at edition size
        IF NOT v_is_open_edition AND next_available_number > v_edition_size_int THEN
            EXIT; 
        END IF;

        -- Linkage Recovery
        v_owner_email := line_item.owner_email;
        v_owner_name := line_item.owner_name;
        v_shopify_customer_id := line_item.shopify_customer_id;
        v_supabase_user_id := line_item.owner_id;

        IF v_owner_email IS NULL OR v_owner_email = '' THEN
            SELECT customer_email, customer_id INTO v_owner_email, v_shopify_customer_id
            FROM orders
            WHERE id::TEXT = line_item.order_id_text;
        END IF;

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

        IF v_supabase_user_id IS NULL AND v_owner_email IS NOT NULL THEN
            SELECT id INTO v_supabase_user_id
            FROM auth.users
            WHERE email = LOWER(v_owner_email)
            LIMIT 1;
        END IF;

        -- Final Update
        UPDATE "public"."order_line_items_v2"
        SET 
            edition_number = next_available_number,
            owner_email = LOWER(v_owner_email),
            owner_name = v_owner_name,
            shopify_customer_id = v_shopify_customer_id,
            owner_id = v_supabase_user_id,
            customer_id = v_supabase_user_id,
            edition_total = v_edition_size_int,
            updated_at = NOW()
        WHERE id = line_item.id;
        
        edition_count := edition_count + 1;
        next_available_number := next_available_number + 1;
    END LOOP;

    RETURN edition_count;
END;
$$;

-- Update trigger function to also respect Street Collector exclusion
CREATE OR REPLACE FUNCTION auto_assign_edition_on_insert_or_update()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'active' 
       AND NEW.edition_number IS NULL 
       AND NEW.product_id IS NOT NULL 
       AND LOWER(COALESCE(NEW.vendor_name, '')) NOT IN ('street collector', 'street-collector') THEN
        
        BEGIN
            PERFORM assign_edition_numbers(NEW.product_id);
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to auto-assign edition number for product %: %', NEW.product_id, SQLERRM;
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

