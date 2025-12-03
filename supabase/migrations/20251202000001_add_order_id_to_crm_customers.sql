-- Add order_id field to crm_customers table to track ChinaDivision order ID
-- This stores the order ID from which the customer was extracted

ALTER TABLE crm_customers
ADD COLUMN IF NOT EXISTS chinadivision_order_id TEXT;

-- Create index for order_id lookups
CREATE INDEX IF NOT EXISTS idx_crm_customers_order_id ON crm_customers(chinadivision_order_id);

