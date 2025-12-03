-- Migration to add missing columns to crm_customers table
-- This handles the case where the table exists but is missing the new columns

-- Add order tracking columns if they don't exist
DO $$
BEGIN
  -- Add chinadivision_order_ids array
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'crm_customers' 
    AND column_name = 'chinadivision_order_ids'
  ) THEN
    ALTER TABLE crm_customers ADD COLUMN chinadivision_order_ids TEXT[];
  END IF;

  -- Add shopify_order_ids array
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'crm_customers' 
    AND column_name = 'shopify_order_ids'
  ) THEN
    ALTER TABLE crm_customers ADD COLUMN shopify_order_ids TEXT[];
  END IF;

  -- Add total_orders
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'crm_customers' 
    AND column_name = 'total_orders'
  ) THEN
    ALTER TABLE crm_customers ADD COLUMN total_orders INTEGER DEFAULT 0;
  END IF;

  -- Add first_order_date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'crm_customers' 
    AND column_name = 'first_order_date'
  ) THEN
    ALTER TABLE crm_customers ADD COLUMN first_order_date TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add last_order_date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'crm_customers' 
    AND column_name = 'last_order_date'
  ) THEN
    ALTER TABLE crm_customers ADD COLUMN last_order_date TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add total_spent
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'crm_customers' 
    AND column_name = 'total_spent'
  ) THEN
    ALTER TABLE crm_customers ADD COLUMN total_spent NUMERIC(10,2) DEFAULT 0;
  END IF;

  -- Add phone
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'crm_customers' 
    AND column_name = 'phone'
  ) THEN
    ALTER TABLE crm_customers ADD COLUMN phone TEXT;
  END IF;

  -- Add address (JSONB)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'crm_customers' 
    AND column_name = 'address'
  ) THEN
    ALTER TABLE crm_customers ADD COLUMN address JSONB;
  END IF;

  -- Add tags array
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'crm_customers' 
    AND column_name = 'tags'
  ) THEN
    ALTER TABLE crm_customers ADD COLUMN tags TEXT[];
  END IF;

  -- Add metadata (JSONB)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'crm_customers' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE crm_customers ADD COLUMN metadata JSONB;
  END IF;
END $$;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_crm_customers_total_orders ON crm_customers(total_orders);
CREATE INDEX IF NOT EXISTS idx_crm_customers_last_order_date ON crm_customers(last_order_date DESC);

