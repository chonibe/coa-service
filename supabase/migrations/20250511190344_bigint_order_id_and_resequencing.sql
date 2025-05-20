-- Enable bigint support for order IDs
ALTER TABLE orders
ALTER COLUMN id TYPE bigint USING id::bigint;

-- Create resequencing utility function
CREATE OR REPLACE FUNCTION resequence_edition_numbers()
RETURNS void AS $$
DECLARE
    order_record RECORD;
    line_item_record RECORD;
    current_edition_number integer;
BEGIN
    -- Loop through all orders
    FOR order_record IN SELECT id FROM orders ORDER BY id LOOP
        current_edition_number := 1;
        
        -- Loop through line items for each order
        FOR line_item_record IN 
            SELECT id 
            FROM order_line_items 
            WHERE order_id = order_record.id 
            ORDER BY id
        LOOP
            -- Update edition number
            UPDATE order_line_items
            SET edition_number = current_edition_number
            WHERE id = line_item_record.id;
            
            current_edition_number := current_edition_number + 1;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add comment to function
COMMENT ON FUNCTION resequence_edition_numbers() IS 'Utility function to resequence edition numbers for all orders'; 