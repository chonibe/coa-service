-- ============================================================================
-- Migration: Add trigger to enforce line item status consistency
-- ============================================================================
-- 
-- This trigger automatically sets status='inactive' for line items that
-- should not be active. This is a DATABASE-LEVEL protection against bugs
-- in application code.
--
-- Conditions that make a line item inactive:
-- 1. restocked = true
-- 2. fulfillment_status = 'restocked'
-- 3. refund_status = 'refunded' (if column exists and has this value)
-- 4. Parent order is canceled/voided (checked via join if needed)
--
-- Note: We can't easily check parent order status in a trigger without
-- a join, so the main protection is checking the line item's own fields.
-- ============================================================================

-- Create the trigger function
CREATE OR REPLACE FUNCTION enforce_line_item_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If item is explicitly restocked, force inactive
  IF NEW.restocked = true THEN
    NEW.status := 'inactive';
    RAISE NOTICE 'Line item % marked inactive: restocked=true', NEW.line_item_id;
  END IF;

  -- If fulfillment_status is 'restocked', force inactive
  IF NEW.fulfillment_status = 'restocked' THEN
    NEW.status := 'inactive';
    RAISE NOTICE 'Line item % marked inactive: fulfillment_status=restocked', NEW.line_item_id;
  END IF;

  -- If refund_status indicates refunded (check for common values)
  IF NEW.refund_status IS NOT NULL AND NEW.refund_status NOT IN ('none', 'pending') THEN
    NEW.status := 'inactive';
    RAISE NOTICE 'Line item % marked inactive: refund_status=%', NEW.line_item_id, NEW.refund_status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_enforce_line_item_status ON order_line_items_v2;

-- Create the trigger
CREATE TRIGGER trigger_enforce_line_item_status
  BEFORE INSERT OR UPDATE ON order_line_items_v2
  FOR EACH ROW
  EXECUTE FUNCTION enforce_line_item_status();

-- Add a comment to document the trigger
COMMENT ON TRIGGER trigger_enforce_line_item_status ON order_line_items_v2 IS 
  'Automatically sets status=inactive for restocked/refunded items. Safety net against application bugs.';

-- ============================================================================
-- Optional: Create a check constraint for additional validation
-- ============================================================================
-- This constraint ensures that if restocked=true, status must be inactive
-- Note: This is commented out because the trigger already handles this,
-- but can be enabled for extra safety

-- ALTER TABLE order_line_items_v2 
-- ADD CONSTRAINT chk_restocked_status 
-- CHECK (restocked = false OR status = 'inactive');
