-- Migration for Vendor Store System
-- Creates tables for vendor store purchases, proof prints, and lamp purchases
-- Adds vendor fields for store functionality

-- Create enum for purchase type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'store_purchase_type') THEN
    CREATE TYPE store_purchase_type AS ENUM ('lamp', 'proof_print');
  END IF;
END $$;

-- Create enum for payment method
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'store_payment_method') THEN
    CREATE TYPE store_payment_method AS ENUM ('payout_balance', 'external');
  END IF;
END $$;

-- Create enum for purchase status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'store_purchase_status') THEN
    CREATE TYPE store_purchase_status AS ENUM ('pending', 'processing', 'fulfilled', 'cancelled');
  END IF;
END $$;

-- Create vendor_store_purchases table
CREATE TABLE IF NOT EXISTS vendor_store_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL REFERENCES vendors(vendor_name),
  purchase_type store_purchase_type NOT NULL,
  product_sku TEXT, -- for Lamp purchases
  artwork_submission_id UUID REFERENCES vendor_product_submissions(id) ON DELETE SET NULL, -- for proof prints
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  discount_percentage NUMERIC(5,2), -- for Lamp discount
  total_amount NUMERIC(10,2) NOT NULL,
  payment_method store_payment_method NOT NULL,
  payout_balance_used NUMERIC(10,2),
  external_payment_id TEXT,
  status store_purchase_status NOT NULL DEFAULT 'pending',
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vendor_proof_prints table
CREATE TABLE IF NOT EXISTS vendor_proof_prints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES vendor_product_submissions(id) ON DELETE CASCADE,
  artwork_title TEXT NOT NULL,
  artwork_image_url TEXT,
  quantity_ordered INTEGER NOT NULL DEFAULT 0 CHECK (quantity_ordered >= 0 AND quantity_ordered <= 2),
  last_ordered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vendor_id, submission_id)
);

-- Create vendor_lamp_purchases table
CREATE TABLE IF NOT EXISTS vendor_lamp_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL REFERENCES vendors(vendor_name),
  product_sku TEXT NOT NULL,
  purchase_price NUMERIC(10,2) NOT NULL,
  discount_applied BOOLEAN NOT NULL DEFAULT false,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns to vendors table
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS has_used_lamp_discount BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS store_balance NUMERIC(10,2) DEFAULT 0;

-- Update vendor_ledger_entries to include store_purchase entry type
DO $$
BEGIN
  -- Check if the constraint exists and update it
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'vendor_ledger_entries_entry_type_check'
  ) THEN
    -- Drop the old constraint
    ALTER TABLE vendor_ledger_entries DROP CONSTRAINT vendor_ledger_entries_entry_type_check;
  END IF;
  
  -- Add new constraint with store_purchase
  ALTER TABLE vendor_ledger_entries
    ADD CONSTRAINT vendor_ledger_entries_entry_type_check 
    CHECK (entry_type IN ('payout', 'refund_deduction', 'adjustment', 'store_purchase'));
EXCEPTION
  WHEN OTHERS THEN
    -- If constraint doesn't exist, create it
    ALTER TABLE vendor_ledger_entries
      ADD CONSTRAINT vendor_ledger_entries_entry_type_check 
      CHECK (entry_type IN ('payout', 'refund_deduction', 'adjustment', 'store_purchase'));
END $$;

-- Create indexes for vendor_store_purchases
CREATE INDEX IF NOT EXISTS idx_vendor_store_purchases_vendor_id ON vendor_store_purchases(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_store_purchases_vendor_name ON vendor_store_purchases(vendor_name);
CREATE INDEX IF NOT EXISTS idx_vendor_store_purchases_status ON vendor_store_purchases(status);
CREATE INDEX IF NOT EXISTS idx_vendor_store_purchases_created_at ON vendor_store_purchases(created_at);
CREATE INDEX IF NOT EXISTS idx_vendor_store_purchases_submission_id ON vendor_store_purchases(artwork_submission_id);

-- Create indexes for vendor_proof_prints
CREATE INDEX IF NOT EXISTS idx_vendor_proof_prints_vendor_id ON vendor_proof_prints(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_proof_prints_submission_id ON vendor_proof_prints(submission_id);

-- Create indexes for vendor_lamp_purchases
CREATE INDEX IF NOT EXISTS idx_vendor_lamp_purchases_vendor_id ON vendor_lamp_purchases(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_lamp_purchases_vendor_name ON vendor_lamp_purchases(vendor_name);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vendor_store_purchases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vendor_store_purchases
DROP TRIGGER IF EXISTS trigger_update_vendor_store_purchases_updated_at ON vendor_store_purchases;
CREATE TRIGGER trigger_update_vendor_store_purchases_updated_at
  BEFORE UPDATE ON vendor_store_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_store_purchases_updated_at();

-- Create function to update vendor_proof_prints updated_at
CREATE OR REPLACE FUNCTION update_vendor_proof_prints_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vendor_proof_prints
DROP TRIGGER IF EXISTS trigger_update_vendor_proof_prints_updated_at ON vendor_proof_prints;
CREATE TRIGGER trigger_update_vendor_proof_prints_updated_at
  BEFORE UPDATE ON vendor_proof_prints
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_proof_prints_updated_at();

