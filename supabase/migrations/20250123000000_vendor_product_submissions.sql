-- Migration for Vendor Product Submissions
-- Creates tables for tracking vendor product submissions and vendor collections

-- Create enum for submission status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_submission_status') THEN
    CREATE TYPE product_submission_status AS ENUM ('pending', 'approved', 'rejected', 'published');
  END IF;
END $$;

-- Create vendor_product_submissions table
CREATE TABLE IF NOT EXISTS vendor_product_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  status product_submission_status NOT NULL DEFAULT 'pending',
  shopify_product_id TEXT,
  product_data JSONB NOT NULL,
  admin_notes TEXT,
  rejection_reason TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  approved_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vendor_collections table for tracking vendor collections
CREATE TABLE IF NOT EXISTS vendor_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  shopify_collection_id TEXT,
  shopify_collection_handle TEXT NOT NULL,
  collection_title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vendor_id)
);

-- Create indexes for vendor_product_submissions
CREATE INDEX IF NOT EXISTS idx_vendor_product_submissions_vendor_id ON vendor_product_submissions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_product_submissions_vendor_name ON vendor_product_submissions(vendor_name);
CREATE INDEX IF NOT EXISTS idx_vendor_product_submissions_status ON vendor_product_submissions(status);
CREATE INDEX IF NOT EXISTS idx_vendor_product_submissions_submitted_at ON vendor_product_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_vendor_product_submissions_shopify_product_id ON vendor_product_submissions(shopify_product_id) WHERE shopify_product_id IS NOT NULL;

-- Create indexes for vendor_collections
CREATE INDEX IF NOT EXISTS idx_vendor_collections_vendor_id ON vendor_collections(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_collections_vendor_name ON vendor_collections(vendor_name);
CREATE INDEX IF NOT EXISTS idx_vendor_collections_shopify_collection_id ON vendor_collections(shopify_collection_id) WHERE shopify_collection_id IS NOT NULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vendor_product_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_vendor_collections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS trigger_update_vendor_product_submissions_updated_at ON vendor_product_submissions;
CREATE TRIGGER trigger_update_vendor_product_submissions_updated_at
  BEFORE UPDATE ON vendor_product_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_product_submissions_updated_at();

DROP TRIGGER IF EXISTS trigger_update_vendor_collections_updated_at ON vendor_collections;
CREATE TRIGGER trigger_update_vendor_collections_updated_at
  BEFORE UPDATE ON vendor_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_collections_updated_at();

-- Add RLS policies
DO $$
BEGIN
  -- Enable RLS on vendor_product_submissions
  ALTER TABLE vendor_product_submissions ENABLE ROW LEVEL SECURITY;
  
  -- Allow all access - application handles authorization via API guards
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'vendor_product_submissions' 
    AND policyname = 'allow_all_with_app_auth'
  ) THEN
    CREATE POLICY allow_all_with_app_auth ON vendor_product_submissions
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Enable RLS on vendor_collections
  ALTER TABLE vendor_collections ENABLE ROW LEVEL SECURITY;
  
  -- Allow all access - application handles authorization via API guards
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'vendor_collections' 
    AND policyname = 'allow_all_with_app_auth'
  ) THEN
    CREATE POLICY allow_all_with_app_auth ON vendor_collections
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

