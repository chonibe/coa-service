-- Repair Script: Update Unlock Type Constraints
-- Run this in your Supabase Dashboard SQL Editor to allow new unlock types

BEGIN;

-- 1. Drop the old constraint that restricts unlock types
ALTER TABLE artwork_series DROP CONSTRAINT IF EXISTS artwork_series_unlock_type_check;

-- 2. Add the updated constraint including 'time_based' and 'vip'
ALTER TABLE artwork_series ADD CONSTRAINT artwork_series_unlock_type_check 
  CHECK (unlock_type IN ('any_purchase', 'sequential', 'threshold', 'time_based', 'vip', 'custom'));

-- 3. Ensure the new columns exist (idempotent checks)
DO $$
BEGIN
  -- unlock_schedule on artwork_series
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artwork_series' AND column_name = 'unlock_schedule') THEN
    ALTER TABLE artwork_series ADD COLUMN unlock_schedule JSONB;
  END IF;

  -- requires_ownership on artwork_series
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artwork_series' AND column_name = 'requires_ownership') THEN
    ALTER TABLE artwork_series ADD COLUMN requires_ownership JSONB;
  END IF;

  -- vip_tier on artwork_series
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artwork_series' AND column_name = 'vip_tier') THEN
    ALTER TABLE artwork_series ADD COLUMN vip_tier INTEGER;
  END IF;

  -- unlock_at on artwork_series_members
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artwork_series_members' AND column_name = 'unlock_at') THEN
    ALTER TABLE artwork_series_members ADD COLUMN unlock_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

COMMIT;

