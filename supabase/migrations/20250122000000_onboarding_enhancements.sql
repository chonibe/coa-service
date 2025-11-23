-- Migration for Vendor Onboarding Enhancements
-- Adds columns for tracking onboarding progress, auto-save, and analytics

-- Add onboarding tracking columns to vendors table
DO $$
BEGIN
  -- Add onboarding_step column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'onboarding_step') THEN
    ALTER TABLE vendors ADD COLUMN onboarding_step INTEGER DEFAULT 0;
  END IF;
  
  -- Add onboarding_data JSONB column for storing partial form data
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'onboarding_data') THEN
    ALTER TABLE vendors ADD COLUMN onboarding_data JSONB;
  END IF;
  
  -- Add onboarding_started_at timestamp
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'onboarding_started_at') THEN
    ALTER TABLE vendors ADD COLUMN onboarding_started_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add onboarding_completed_at timestamp
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'onboarding_completed_at') THEN
    ALTER TABLE vendors ADD COLUMN onboarding_completed_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add onboarding_abandoned_at timestamp
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'onboarding_abandoned_at') THEN
    ALTER TABLE vendors ADD COLUMN onboarding_abandoned_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_vendors_onboarding_step ON vendors(onboarding_step) WHERE onboarding_completed = false;
CREATE INDEX IF NOT EXISTS idx_vendors_onboarding_started ON vendors(onboarding_started_at) WHERE onboarding_started_at IS NOT NULL;

-- Create onboarding_analytics table for tracking step-by-step analytics
CREATE TABLE IF NOT EXISTS onboarding_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name TEXT NOT NULL REFERENCES vendors(vendor_name) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  time_spent_seconds INTEGER,
  entered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  exited_at TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for onboarding_analytics
CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_vendor ON onboarding_analytics(vendor_name);
CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_step ON onboarding_analytics(step_number);
CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_created ON onboarding_analytics(created_at);

-- Add RLS policies if RLS is enabled
DO $$
BEGIN
  -- Enable RLS on onboarding_analytics
  ALTER TABLE onboarding_analytics ENABLE ROW LEVEL SECURITY;
  
  -- Allow all access - application handles authorization via API guards
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'onboarding_analytics' 
    AND policyname = 'allow_all_with_app_auth'
  ) THEN
    CREATE POLICY allow_all_with_app_auth ON onboarding_analytics
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

