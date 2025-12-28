-- Migration for Payment Dashboard Enhancements
-- Creates tables for disputes, updates payout_schedules structure

-- Update payout_schedules table to match new structure (if it exists with old structure)
DO $$
BEGIN
  -- Add new columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payout_schedules' AND column_name = 'name') THEN
    ALTER TABLE payout_schedules ADD COLUMN name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payout_schedules' AND column_name = 'frequency') THEN
    ALTER TABLE payout_schedules ADD COLUMN frequency TEXT CHECK (frequency IN ('weekly', 'bi-weekly', 'monthly'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payout_schedules' AND column_name = 'auto_process') THEN
    ALTER TABLE payout_schedules ADD COLUMN auto_process BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payout_schedules' AND column_name = 'threshold') THEN
    ALTER TABLE payout_schedules ADD COLUMN threshold DECIMAL(10, 2);
  END IF;
  
  -- Migrate schedule_type to frequency if needed
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payout_schedules' AND column_name = 'schedule_type') THEN
    UPDATE payout_schedules 
    SET frequency = CASE 
      WHEN schedule_type = 'weekly' THEN 'weekly'
      WHEN schedule_type = 'monthly' THEN 'monthly'
      ELSE 'monthly'
    END
    WHERE frequency IS NULL;
  END IF;
END $$;

-- Create payout_disputes table
CREATE TABLE IF NOT EXISTS payout_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL REFERENCES vendors(vendor_name) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'escalated', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_by TEXT,
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for payout_disputes
CREATE INDEX IF NOT EXISTS idx_payout_disputes_vendor ON payout_disputes(vendor_name);
CREATE INDEX IF NOT EXISTS idx_payout_disputes_status ON payout_disputes(status);
CREATE INDEX IF NOT EXISTS idx_payout_disputes_payout_id ON payout_disputes(payout_id);
CREATE INDEX IF NOT EXISTS idx_payout_disputes_priority ON payout_disputes(priority) WHERE status != 'closed';

-- Create payout_dispute_comments table
CREATE TABLE IF NOT EXISTS payout_dispute_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES payout_disputes(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  author TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for payout_dispute_comments
CREATE INDEX IF NOT EXISTS idx_payout_dispute_comments_dispute ON payout_dispute_comments(dispute_id);
CREATE INDEX IF NOT EXISTS idx_payout_dispute_comments_created ON payout_dispute_comments(created_at);

-- Add RLS policies if RLS is enabled
-- Note: Authentication is handled at the application level via API guards
-- RLS is enabled for security but policies allow access - app layer enforces authorization
DO $$
BEGIN
  -- Enable RLS on payout_disputes
  ALTER TABLE payout_disputes ENABLE ROW LEVEL SECURITY;
  
  -- Allow all access - application handles authorization via API guards
  -- This is safe because all API endpoints use guardAdminRequest or vendor auth checks
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payout_disputes' 
    AND policyname = 'allow_all_with_app_auth'
  ) THEN
    CREATE POLICY allow_all_with_app_auth ON payout_disputes
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
  
  -- Enable RLS on payout_dispute_comments
  ALTER TABLE payout_dispute_comments ENABLE ROW LEVEL SECURITY;
  
  -- Allow all access - application handles authorization
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payout_dispute_comments' 
    AND policyname = 'allow_all_with_app_auth'
  ) THEN
    CREATE POLICY allow_all_with_app_auth ON payout_dispute_comments
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

