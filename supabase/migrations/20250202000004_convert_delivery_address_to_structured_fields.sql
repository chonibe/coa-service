-- Convert delivery_address from single text field to structured Shopify-compatible fields

-- Drop the old delivery_address column if it exists
ALTER TABLE vendors
  DROP COLUMN IF EXISTS delivery_address;

-- Add structured delivery address fields matching Shopify format
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS delivery_address1 TEXT,
  ADD COLUMN IF NOT EXISTS delivery_address2 TEXT,
  ADD COLUMN IF NOT EXISTS delivery_city TEXT,
  ADD COLUMN IF NOT EXISTS delivery_province TEXT,
  ADD COLUMN IF NOT EXISTS delivery_country TEXT,
  ADD COLUMN IF NOT EXISTS delivery_zip TEXT,
  ADD COLUMN IF NOT EXISTS delivery_phone TEXT,
  ADD COLUMN IF NOT EXISTS delivery_name TEXT;

COMMENT ON COLUMN vendors.delivery_address1 IS 'Street address line 1 for delivery (Shopify format)';
COMMENT ON COLUMN vendors.delivery_address2 IS 'Street address line 2 for delivery (Shopify format)';
COMMENT ON COLUMN vendors.delivery_city IS 'City for delivery (Shopify format)';
COMMENT ON COLUMN vendors.delivery_province IS 'State/Province for delivery (Shopify format)';
COMMENT ON COLUMN vendors.delivery_country IS 'Country for delivery (Shopify format)';
COMMENT ON COLUMN vendors.delivery_zip IS 'ZIP/Postal code for delivery (Shopify format)';
COMMENT ON COLUMN vendors.delivery_phone IS 'Phone number for delivery (Shopify format)';
COMMENT ON COLUMN vendors.delivery_name IS 'Full name for delivery (Shopify format)';

