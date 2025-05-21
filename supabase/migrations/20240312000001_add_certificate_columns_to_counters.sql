-- Add certificate-related columns to product_edition_counters
ALTER TABLE product_edition_counters
ADD COLUMN IF NOT EXISTS certificate_url TEXT,
ADD COLUMN IF NOT EXISTS certificate_token TEXT,
ADD COLUMN IF NOT EXISTS certificate_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_product_edition_counters_certificate_url ON product_edition_counters(certificate_url);
CREATE INDEX IF NOT EXISTS idx_product_edition_counters_certificate_token ON product_edition_counters(certificate_token); 