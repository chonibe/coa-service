-- Add Stripe-related fields to vendors table
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS stripe_account_created_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS stripe_last_updated_at TIMESTAMP WITH TIME ZONE;

-- Add Stripe fields to vendor_payouts table
ALTER TABLE vendor_payouts ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT;
ALTER TABLE vendor_payouts ADD COLUMN IF NOT EXISTS stripe_payout_id TEXT;
