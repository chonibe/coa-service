-- Add refund tracking columns to order_line_items_v2
ALTER TABLE order_line_items_v2
ADD COLUMN IF NOT EXISTS refund_status TEXT DEFAULT 'none' CHECK (refund_status IN ('none', 'partial', 'full')),
ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE;

-- Create index on refund_status for faster queries
CREATE INDEX IF NOT EXISTS idx_order_line_items_v2_refund_status 
ON order_line_items_v2(refund_status) 
WHERE refund_status != 'none';

-- Create vendor_ledger_entries table to track all payout-related transactions
-- This includes both positive (payouts) and negative (refund deductions) entries
CREATE TABLE IF NOT EXISTS vendor_ledger_entries (
  id SERIAL PRIMARY KEY,
  vendor_name TEXT NOT NULL REFERENCES vendors(vendor_name),
  line_item_id TEXT,
  order_id TEXT,
  amount NUMERIC(10,2) NOT NULL, -- Can be negative for refunds
  entry_type TEXT NOT NULL CHECK (entry_type IN ('payout', 'refund_deduction', 'adjustment')),
  payout_id INTEGER REFERENCES vendor_payouts(id),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT, -- Admin email or system
  metadata JSONB
);

-- Create indexes for vendor_ledger_entries
CREATE INDEX IF NOT EXISTS idx_vendor_ledger_vendor_name ON vendor_ledger_entries(vendor_name);
CREATE INDEX IF NOT EXISTS idx_vendor_ledger_line_item_id ON vendor_ledger_entries(line_item_id);
CREATE INDEX IF NOT EXISTS idx_vendor_ledger_payout_id ON vendor_ledger_entries(payout_id);
CREATE INDEX IF NOT EXISTS idx_vendor_ledger_entry_type ON vendor_ledger_entries(entry_type);

-- Add payout_batch_id to vendor_payouts for PayPal tracking
ALTER TABLE vendor_payouts
ADD COLUMN IF NOT EXISTS payout_batch_id TEXT;

-- Create index on payout_batch_id
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_batch_id ON vendor_payouts(payout_batch_id);

