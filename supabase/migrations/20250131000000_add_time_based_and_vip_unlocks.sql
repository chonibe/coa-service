-- Migration: Add Time-Based and VIP Unlock Types
-- Extends unlock system to support time-based schedules and VIP/loyalty unlocks

-- Update unlock_type constraint to include new types
DO $$
BEGIN
  -- Drop existing constraint
  ALTER TABLE artwork_series DROP CONSTRAINT IF EXISTS artwork_series_unlock_type_check;
  
  -- Add new constraint with all unlock types
  ALTER TABLE artwork_series ADD CONSTRAINT artwork_series_unlock_type_check 
    CHECK (unlock_type IN ('any_purchase', 'sequential', 'threshold', 'time_based', 'vip', 'custom'));
END $$;

-- Add unlock_at timestamp to artwork_series_members for time-based unlocks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artwork_series_members' AND column_name = 'unlock_at'
  ) THEN
    ALTER TABLE artwork_series_members 
    ADD COLUMN unlock_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add unlock_schedule JSONB to artwork_series for recurring time-based unlocks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artwork_series' AND column_name = 'unlock_schedule'
  ) THEN
    ALTER TABLE artwork_series 
    ADD COLUMN unlock_schedule JSONB;
  END IF;
END $$;

-- Add requires_ownership JSONB to artwork_series for VIP unlocks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artwork_series' AND column_name = 'requires_ownership'
  ) THEN
    ALTER TABLE artwork_series 
    ADD COLUMN requires_ownership JSONB;
  END IF;
END $$;

-- Add vip_tier field to artwork_series for loyalty tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artwork_series' AND column_name = 'vip_tier'
  ) THEN
    ALTER TABLE artwork_series 
    ADD COLUMN vip_tier INTEGER;
  END IF;
END $$;

-- Create index for unlock_at for efficient time-based queries
CREATE INDEX IF NOT EXISTS idx_series_members_unlock_at ON artwork_series_members(unlock_at) WHERE unlock_at IS NOT NULL;

-- Create index for unlock_schedule for recurring unlock queries
CREATE INDEX IF NOT EXISTS idx_artwork_series_unlock_schedule ON artwork_series USING GIN (unlock_schedule) WHERE unlock_schedule IS NOT NULL;

-- Create index for requires_ownership for VIP unlock queries
CREATE INDEX IF NOT EXISTS idx_artwork_series_requires_ownership ON artwork_series USING GIN (requires_ownership) WHERE requires_ownership IS NOT NULL;

