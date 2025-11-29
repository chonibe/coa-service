-- Add delivery_address field to vendors table for store purchases

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS delivery_address TEXT;

COMMENT ON COLUMN vendors.delivery_address IS 'Delivery address for store purchases (Lamps and proof prints). Separate from business address.';

