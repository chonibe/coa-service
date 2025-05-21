-- Create backup_settings table
CREATE TABLE IF NOT EXISTS backup_settings (
  id BIGINT PRIMARY KEY DEFAULT 1,
  google_drive_enabled BOOLEAN NOT NULL DEFAULT true,
  google_drive_folder_id TEXT,
  retention_days INTEGER NOT NULL DEFAULT 30,
  max_backups INTEGER NOT NULL DEFAULT 10,
  schedule_database TEXT NOT NULL DEFAULT '0 0 * * *',
  schedule_sheets TEXT NOT NULL DEFAULT '0 1 * * *',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create backups table
CREATE TABLE IF NOT EXISTS backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('database', 'sheets')),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  url TEXT,
  size TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE backup_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read backup settings" ON backup_settings;
DROP POLICY IF EXISTS "Allow authenticated users to update backup settings" ON backup_settings;
DROP POLICY IF EXISTS "Allow authenticated users to insert backup settings" ON backup_settings;
DROP POLICY IF EXISTS "Allow authenticated users to read backups" ON backups;
DROP POLICY IF EXISTS "Allow authenticated users to insert backups" ON backups;
DROP POLICY IF EXISTS "Allow authenticated users to delete backups" ON backups;

-- Create new policies with proper permissions
CREATE POLICY "Enable all access for authenticated users on backup_settings"
  ON backup_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users on backups"
  ON backups
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant service role permissions to bypass RLS
ALTER TABLE backup_settings FORCE ROW LEVEL SECURITY;
ALTER TABLE backups FORCE ROW LEVEL SECURITY;

GRANT ALL ON backup_settings TO service_role;
GRANT ALL ON backups TO service_role;

-- Insert default settings if table is empty
INSERT INTO backup_settings (id, google_drive_enabled, retention_days, max_backups, schedule_database, schedule_sheets)
SELECT 1, true, 30, 10, '0 0 * * *', '0 1 * * *'
WHERE NOT EXISTS (SELECT 1 FROM backup_settings WHERE id = 1); 