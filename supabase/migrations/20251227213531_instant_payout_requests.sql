-- Create instant_payout_requests table for on-demand payout requests
CREATE TABLE IF NOT EXISTS instant_payout_requests (
  id SERIAL PRIMARY KEY,
  vendor_name TEXT NOT NULL REFERENCES vendors(vendor_name) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  fee_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('paypal', 'stripe', 'bank_transfer')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  payout_id INTEGER REFERENCES vendor_payouts(id),
  admin_notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for instant_payout_requests
CREATE INDEX IF NOT EXISTS idx_instant_payout_requests_vendor 
ON instant_payout_requests(vendor_name);

CREATE INDEX IF NOT EXISTS idx_instant_payout_requests_status 
ON instant_payout_requests(status);

CREATE INDEX IF NOT EXISTS idx_instant_payout_requests_requested_at 
ON instant_payout_requests(requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_instant_payout_requests_payout_id 
ON instant_payout_requests(payout_id);

-- Add instant payout settings to payout_schedules table
ALTER TABLE payout_schedules
ADD COLUMN IF NOT EXISTS instant_payouts_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS instant_payout_fee_percent NUMERIC(5,2) DEFAULT 0 CHECK (instant_payout_fee_percent >= 0 AND instant_payout_fee_percent <= 100);

-- Add payment_method to payout_schedules
ALTER TABLE payout_schedules
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'paypal' 
CHECK (payment_method IN ('paypal', 'stripe', 'bank_transfer'));








