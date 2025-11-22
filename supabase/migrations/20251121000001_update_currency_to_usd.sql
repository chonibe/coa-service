-- Update currency default to USD for vendor_payouts table
ALTER TABLE vendor_payouts 
ALTER COLUMN currency SET DEFAULT 'USD';

-- Update existing payouts without currency to USD (optional, only if you want to backfill)
-- UPDATE vendor_payouts SET currency = 'USD' WHERE currency IS NULL OR currency = 'GBP';

