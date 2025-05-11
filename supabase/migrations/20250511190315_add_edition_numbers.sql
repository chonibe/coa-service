-- Add edition_number column to order_line_items_v2
ALTER TABLE "public"."order_line_items_v2" 
ADD COLUMN IF NOT EXISTS "edition_number" INTEGER,
ADD COLUMN IF NOT EXISTS "edition_total" INTEGER;

-- Create a function to assign edition numbers for a product
CREATE OR REPLACE FUNCTION assign_edition_numbers(product_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    edition_count INTEGER := 0;
    line_item RECORD;
BEGIN
    -- Clear any existing edition numbers for this product
    UPDATE "public"."order_line_items_v2"
    SET edition_number = NULL
    WHERE product_id = $1;

    -- Get all active line items for this product, ordered by creation date
    FOR line_item IN 
        SELECT id, created_at
        FROM "public"."order_line_items_v2"
        WHERE product_id = $1
        AND status = 'active'
        ORDER BY created_at ASC
    LOOP
        edition_count := edition_count + 1;
        
        -- Update the line item with its edition number
        UPDATE "public"."order_line_items_v2"
        SET edition_number = edition_count
        WHERE id = line_item.id;
    END LOOP;

    -- Update the edition_total for all line items of this product
    UPDATE "public"."order_line_items_v2"
    SET edition_total = edition_count
    WHERE product_id = $1;

    RETURN edition_count;
END;
$$;

-- Create a function to get the next available edition number for a product
CREATE OR REPLACE FUNCTION get_next_edition_number(product_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    next_number INTEGER;
BEGIN
    -- Get the highest edition number for this product
    SELECT COALESCE(MAX(edition_number), 0) + 1
    INTO next_number
    FROM "public"."order_line_items_v2"
    WHERE product_id = $1
    AND status = 'active';

    RETURN next_number;
END;
$$;

-- Create a function to get the total editions for a product
CREATE OR REPLACE FUNCTION get_total_editions(product_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    total INTEGER;
BEGIN
    -- Count active line items for this product
    SELECT COUNT(*)
    INTO total
    FROM "public"."order_line_items_v2"
    WHERE product_id = $1
    AND status = 'active';

    RETURN total;
END;
$$; 