-- Polaris Updates Tracking Table
-- Stores information about available Polaris updates for admin approval

CREATE TABLE IF NOT EXISTS polaris_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Package information
  package_name TEXT NOT NULL,
  current_version TEXT NOT NULL,
  latest_version TEXT NOT NULL,
  update_type TEXT NOT NULL CHECK (update_type IN ('major', 'minor', 'patch')),
  
  -- Release information
  release_date TIMESTAMPTZ NOT NULL,
  changelog_url TEXT NOT NULL,
  migration_guide_url TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'installed')),
  
  -- Approval tracking
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  
  -- Installation tracking
  installed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate updates
  UNIQUE(package_name, latest_version)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_polaris_updates_status ON polaris_updates(status);
CREATE INDEX IF NOT EXISTS idx_polaris_updates_created_at ON polaris_updates(created_at DESC);

-- Enable Row Level Security
ALTER TABLE polaris_updates ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get current user's email
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = auth.uid();
  
  -- Check if email is in admin list
  -- Admin emails: choni@thestreetlamp.com, chonibe@gmail.com, info@thestreetlamp.com
  RETURN user_email IN (
    'choni@thestreetlamp.com',
    'chonibe@gmail.com', 
    'info@thestreetlamp.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy: Admin users can view all updates
CREATE POLICY "Admin users can view polaris updates"
  ON polaris_updates
  FOR SELECT
  USING (is_admin_user());

-- Policy: Admin users can insert updates (for automated checks)
CREATE POLICY "Admin users can create polaris updates"
  ON polaris_updates
  FOR INSERT
  WITH CHECK (is_admin_user());

-- Policy: Admin users can update status
CREATE POLICY "Admin users can update polaris updates"
  ON polaris_updates
  FOR UPDATE
  USING (is_admin_user());

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_polaris_updates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_polaris_updates_timestamp
  BEFORE UPDATE ON polaris_updates
  FOR EACH ROW
  EXECUTE FUNCTION update_polaris_updates_updated_at();

-- Comments for documentation
COMMENT ON TABLE polaris_updates IS 'Tracks available Polaris package updates for admin approval';
COMMENT ON COLUMN polaris_updates.package_name IS 'Name of the Polaris package (e.g., @shopify/polaris)';
COMMENT ON COLUMN polaris_updates.update_type IS 'Type of update: major (breaking), minor (features), or patch (fixes)';
COMMENT ON COLUMN polaris_updates.status IS 'Current status: pending, approved, rejected, or installed';
COMMENT ON COLUMN polaris_updates.approved_by IS 'User ID of admin who approved/rejected the update';
