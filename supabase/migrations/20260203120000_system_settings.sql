-- Create system_settings table for global configuration
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on key for fast lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write system settings (admin access via API)
CREATE POLICY "Service role full access to system_settings"
  ON system_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE system_settings IS 'Global system configuration settings';
COMMENT ON COLUMN system_settings.key IS 'Unique identifier for the setting';
COMMENT ON COLUMN system_settings.value IS 'JSON value of the setting';
