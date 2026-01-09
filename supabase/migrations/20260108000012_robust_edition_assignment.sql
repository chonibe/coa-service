-- Migration: Robust Edition Assignment
-- 1. Skips products from 'Street Collector' vendor.
-- 2. Gracefully handles foreign key violations for customer_id.
-- 3. Excludes restocked/canceled/refunded/voided orders.

CREATE OR REPLACE FUNCTION assign_edition_numbers(p_product_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    edition_count INTEGER := 0;
    line_item RECORD;
    v_edition_size_text TEXT;
    v_edition_size_int INTEGER;
    v_vendor_name TEXT;
    v_is_open_edition BOOLEAN;
    next_available_number INTEGER := 1;
    used_edition_numbers INTEGER[];
    v_owner_email TEXT;
    v_owner_name TEXT;
    v_shopify_customer_id TEXT;
    v_supabase_user_id UUID;
BEGIN
    -- Get product info
    SELECT 
        edition_size, vendor_name INTO v_edition_size_text, v_vendor_name
    FROM products
    WHERE product_id::TEXT = p_product_id::TEXT;

    -- SKIP STREET COLLECTOR PRODUCTS (per user request)
    IF v_vendor_name = 'Street Collector' THEN
        RETURN 0;
    END IF;

    -- Determine if it's an open edition
    v_is_open_edition := (v_edition_size_text IS NULL OR v_edition_size_text = '' OR v_edition_size_text = '0');
    
    -- Convert to integer
    IF NOT v_is_open_edition THEN
        v_edition_size_int := v_edition_size_text::INTEGER;
    ELSE
        v_edition_size_int := NULL;
    END IF;

    -- Get all edition numbers currently used by authenticated items in VALID orders
    SELECT ARRAY_AGG(edition_number) INTO used_edition_numbers
    FROM "public"."order_line_items_v2" li
    JOIN "public"."orders" o ON o.id::TEXT = li.order_id::TEXT
    WHERE li.product_id::TEXT = p_product_id::TEXT
    AND li.status = 'active'
    AND li.nfc_claimed_at IS NOT NULL
    AND li.edition_number IS NOT NULL
    AND o.fulfillment_status NOT IN ('restocked', 'canceled')
    AND o.financial_status NOT IN ('refunded', 'voided');

    -- Find start number
    IF used_edition_numbers IS NULL OR array_length(used_edition_numbers, 1) IS NULL THEN
        next_available_number := 1;
    ELSE
        WHILE next_available_number = ANY(used_edition_numbers) LOOP
            next_available_number := next_available_number + 1;
        END LOOP;
    END IF;

    -- Reset numbers for non-authenticated OR items in invalid orders
    UPDATE "public"."order_line_items_v2" li
    SET edition_number = NULL
    FROM "public"."orders" o
    WHERE li.order_id::TEXT = o.id::TEXT
    AND li.product_id::TEXT = p_product_id::TEXT
    AND (
        li.nfc_claimed_at IS NULL
        OR o.fulfillment_status IN ('restocked', 'canceled')
        OR o.financial_status IN ('refunded', 'voided')
    );

    FOR line_item IN 
        SELECT li.id, li.order_id::TEXT as order_id_text, li.line_item_id, li.created_at, li.nfc_claimed_at, li.edition_number, li.owner_name, li.owner_email, li.customer_id, li.owner_id, li.shopify_customer_id, o.order_name
        FROM "public"."order_line_items_v2" li
        LEFT JOIN "public"."orders" o ON o.id::TEXT = li.order_id::TEXT
        WHERE li.product_id::TEXT = p_product_id::TEXT
        AND li.status = 'active'
        AND o.fulfillment_status NOT IN ('restocked', 'canceled')
        AND o.financial_status NOT IN ('refunded', 'voided')
        ORDER BY li.created_at ASC
    LOOP
        IF line_item.nfc_claimed_at IS NOT NULL AND line_item.edition_number IS NOT NULL THEN
            CONTINUE;
        END IF;
        
        WHILE next_available_number = ANY(COALESCE(used_edition_numbers, ARRAY[]::INTEGER[])) LOOP
            next_available_number := next_available_number + 1;
        END LOOP;
        
        IF NOT v_is_open_edition AND next_available_number > v_edition_size_int THEN
            -- Instead of failing, we just stop assigning numbers but don't crash
            EXIT; 
        END IF;

        -- Linkage Logic (PII Resolution)
        v_owner_email := line_item.owner_email;
        v_owner_name := line_item.owner_name;
        v_shopify_customer_id := line_item.shopify_customer_id;
        v_supabase_user_id := line_item.owner_id;

        -- 1. Check for existing Supabase User ID
        IF v_supabase_user_id IS NOT NULL THEN
            DECLARE
                profile_first_name TEXT;
                profile_last_name TEXT;
                profile_email TEXT;
            BEGIN
                SELECT first_name, last_name, email INTO profile_first_name, profile_last_name, profile_email
                FROM collector_profiles
                WHERE user_id = v_supabase_user_id
                LIMIT 1;

                IF profile_email IS NOT NULL THEN
                    v_owner_email := profile_email;
                    v_owner_name := TRIM(COALESCE(profile_first_name || ' ', '') || COALESCE(profile_last_name, ''));
                END IF;
            END;
        END IF;

        -- 2. If still no data, check Orders table
        IF v_owner_email IS NULL OR v_owner_email = '' THEN
            SELECT customer_email, customer_id::TEXT INTO v_owner_email, v_shopify_customer_id
            FROM orders
            WHERE id::TEXT = line_item.order_id_text;
        END IF;

        -- 3. Check Warehouse cache
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

        -- 4. Match Supabase User ID by email
        IF v_supabase_user_id IS NULL AND v_owner_email IS NOT NULL THEN
            SELECT id INTO v_supabase_user_id
            FROM users
            WHERE LOWER(email) = LOWER(v_owner_email)
            LIMIT 1;
        END IF;

        BEGIN
            UPDATE "public"."order_line_items_v2"
            SET 
                edition_number = next_available_number,
                owner_email = v_owner_email,
                owner_name = v_owner_name,
                shopify_customer_id = v_shopify_customer_id,
                owner_id = v_supabase_user_id,
                customer_id = v_supabase_user_id,
                edition_total = v_edition_size_int
            WHERE id = line_item.id;
            
            edition_count := edition_count + 1;
            next_available_number := next_available_number + 1;
        EXCEPTION
            WHEN foreign_key_violation THEN
                -- If customer_id violates FK, update without customer_id/owner_id
                UPDATE "public"."order_line_items_v2"
                SET 
                    edition_number = next_available_number,
                    owner_email = v_owner_email,
                    owner_name = v_owner_name,
                    shopify_customer_id = v_shopify_customer_id,
                    edition_total = v_edition_size_int
                WHERE id = line_item.id;
                
                edition_count := edition_count + 1;
                next_available_number := next_available_number + 1;
            WHEN unique_violation THEN
                next_available_number := next_available_number + 1;
                CONTINUE;
        END;
    END LOOP;

    RETURN edition_count;
END;
$$;

