-- Migration: Auto-generate auth_code for new order_line_items_v2 records
-- Generates unique authentication codes in format XXXX-XXXX-XXXX

-- Function to generate a random auth code
CREATE OR REPLACE FUNCTION generate_auth_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate code in format XXXX-XXXX-XXXX (alphanumeric)
    code := UPPER(
      SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 4) || '-' ||
      SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 5 FOR 4) || '-' ||
      SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 9 FOR 4)
    );
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM order_line_items_v2 WHERE auth_code = code) INTO exists_check;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-generate auth_code on insert
CREATE OR REPLACE FUNCTION set_auth_code_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate auth_code if it's not already set and the item is active
  IF NEW.auth_code IS NULL AND NEW.status = 'active' THEN
    NEW.auth_code := generate_auth_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_set_auth_code ON order_line_items_v2;
CREATE TRIGGER trigger_set_auth_code
  BEFORE INSERT ON order_line_items_v2
  FOR EACH ROW
  EXECUTE FUNCTION set_auth_code_on_insert();

-- Backfill existing active line items that don't have auth_code
UPDATE order_line_items_v2
SET auth_code = generate_auth_code()
WHERE auth_code IS NULL 
  AND status = 'active'
  AND nfc_claimed_at IS NULL; -- Only for unauthenticated items

-- Add comment for documentation
COMMENT ON FUNCTION generate_auth_code() IS 'Generates a unique authentication code in format XXXX-XXXX-XXXX for manual NFC authentication fallback';
