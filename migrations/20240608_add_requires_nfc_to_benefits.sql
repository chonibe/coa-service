-- Add requires_nfc column to product_benefits table
ALTER TABLE product_benefits ADD COLUMN IF NOT EXISTS requires_nfc BOOLEAN DEFAULT TRUE;

-- Update existing benefits to require NFC by default
UPDATE product_benefits SET requires_nfc = TRUE WHERE requires_nfc IS NULL; 