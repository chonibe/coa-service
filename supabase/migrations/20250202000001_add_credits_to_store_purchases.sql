-- Add credits support to vendor store purchases
-- Add credits_used column and update payment method enum

-- Update store_payment_method enum to include 'credits'
DO $$
BEGIN
  -- Check if 'credits' already exists in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'credits' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'store_payment_method')
  ) THEN
    ALTER TYPE store_payment_method ADD VALUE 'credits';
  END IF;
END $$;

-- Add credits_used column to vendor_store_purchases
ALTER TABLE vendor_store_purchases
ADD COLUMN IF NOT EXISTS credits_used NUMERIC(10,2);

-- Add index for credits_used queries
CREATE INDEX IF NOT EXISTS idx_vendor_store_purchases_credits_used 
ON vendor_store_purchases(credits_used) 
WHERE credits_used IS NOT NULL;

