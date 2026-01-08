-- Migration: Auto-Assign Edition Number Trigger
-- Automatically assigns edition numbers when line items become active
-- Uses AFTER trigger and UPDATE to assign numbers

CREATE OR REPLACE FUNCTION auto_assign_edition_on_insert_or_update()
RETURNS TRIGGER AS $$
DECLARE
    assigned_count INTEGER;
BEGIN
    -- Only auto-assign if:
    -- 1. Status is 'active'
    -- 2. Edition number is NULL
    -- 3. Product ID exists
    IF NEW.status = 'active' 
       AND NEW.edition_number IS NULL 
       AND NEW.product_id IS NOT NULL THEN
        
        -- Call assign_edition_numbers function for this product
        -- This will assign numbers to all active items without numbers
        BEGIN
            PERFORM assign_edition_numbers(NEW.product_id);
            
        EXCEPTION
            WHEN OTHERS THEN
                -- Log error but don't fail the insert/update
                RAISE WARNING 'Failed to auto-assign edition number for product %: %', NEW.product_id, SQLERRM;
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger AFTER INSERT and UPDATE
-- This ensures the row exists before we try to assign edition numbers
-- The assign_edition_numbers function will update the row with the edition number
DROP TRIGGER IF EXISTS trg_auto_assign_edition ON order_line_items_v2;
CREATE TRIGGER trg_auto_assign_edition
AFTER INSERT OR UPDATE ON order_line_items_v2
FOR EACH ROW
WHEN (NEW.status = 'active' AND NEW.edition_number IS NULL AND NEW.product_id IS NOT NULL)
EXECUTE FUNCTION auto_assign_edition_on_insert_or_update();

-- Add comment
COMMENT ON FUNCTION auto_assign_edition_on_insert_or_update() IS 'Automatically assigns edition numbers to line items when they become active and have no edition number.';
COMMENT ON TRIGGER trg_auto_assign_edition ON order_line_items_v2 IS 'Triggers automatic edition number assignment when line items are inserted or updated with active status and no edition number.';

