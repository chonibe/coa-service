-- Migration for Artwork Series and Unlock System
-- Creates tables for managing artwork series, unlock mechanisms, and series members

-- Create artwork_series table
CREATE TABLE IF NOT EXISTS artwork_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  unlock_type TEXT NOT NULL CHECK (unlock_type IN ('any_purchase', 'sequential', 'threshold', 'custom')),
  unlock_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure unique series name per vendor
  UNIQUE(vendor_id, name)
);

-- Create artwork_series_members table
CREATE TABLE IF NOT EXISTS artwork_series_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES artwork_series(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES vendor_product_submissions(id) ON DELETE CASCADE,
  shopify_product_id TEXT,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  unlock_order INTEGER,
  display_order INTEGER NOT NULL DEFAULT 0,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure unique submission per series
  UNIQUE(series_id, submission_id)
);

-- Create partial unique index for shopify_product_id (only when not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_series_members_unique_product 
ON artwork_series_members(series_id, shopify_product_id) 
WHERE shopify_product_id IS NOT NULL;

-- Add series columns to vendor_product_submissions
DO $$
BEGIN
  -- Add series_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vendor_product_submissions' AND column_name = 'series_id'
  ) THEN
    ALTER TABLE vendor_product_submissions 
    ADD COLUMN series_id UUID REFERENCES artwork_series(id) ON DELETE SET NULL;
  END IF;

  -- Add series_metadata column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vendor_product_submissions' AND column_name = 'series_metadata'
  ) THEN
    ALTER TABLE vendor_product_submissions 
    ADD COLUMN series_metadata JSONB;
  END IF;
END $$;

-- Create indexes for artwork_series
CREATE INDEX IF NOT EXISTS idx_artwork_series_vendor_id ON artwork_series(vendor_id);
CREATE INDEX IF NOT EXISTS idx_artwork_series_vendor_name ON artwork_series(vendor_name);
CREATE INDEX IF NOT EXISTS idx_artwork_series_is_active ON artwork_series(is_active) WHERE is_active = true;

-- Create indexes for artwork_series_members
CREATE INDEX IF NOT EXISTS idx_series_members_series_id ON artwork_series_members(series_id);
CREATE INDEX IF NOT EXISTS idx_series_members_submission_id ON artwork_series_members(submission_id) WHERE submission_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_series_members_product_id ON artwork_series_members(shopify_product_id) WHERE shopify_product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_series_members_unlock_order ON artwork_series_members(unlock_order) WHERE unlock_order IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_series_members_display_order ON artwork_series_members(display_order);

-- Create index for vendor_product_submissions series_id
CREATE INDEX IF NOT EXISTS idx_vendor_product_submissions_series_id ON vendor_product_submissions(series_id) WHERE series_id IS NOT NULL;

-- Create function to update updated_at timestamp for artwork_series
CREATE OR REPLACE FUNCTION update_artwork_series_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at on artwork_series
DROP TRIGGER IF EXISTS trigger_update_artwork_series_updated_at ON artwork_series;
CREATE TRIGGER trigger_update_artwork_series_updated_at
  BEFORE UPDATE ON artwork_series
  FOR EACH ROW
  EXECUTE FUNCTION update_artwork_series_updated_at();

-- Add RLS policies
DO $$
BEGIN
  -- Enable RLS on artwork_series
  ALTER TABLE artwork_series ENABLE ROW LEVEL SECURITY;
  
  -- Allow all access - application handles authorization via API guards
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'artwork_series' 
    AND policyname = 'allow_all_with_app_auth'
  ) THEN
    CREATE POLICY allow_all_with_app_auth ON artwork_series
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Enable RLS on artwork_series_members
  ALTER TABLE artwork_series_members ENABLE ROW LEVEL SECURITY;
  
  -- Allow all access - application handles authorization via API guards
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'artwork_series_members' 
    AND policyname = 'allow_all_with_app_auth'
  ) THEN
    CREATE POLICY allow_all_with_app_auth ON artwork_series_members
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

