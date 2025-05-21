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

-- Allow only authenticated users to read backup settings
CREATE POLICY "Allow authenticated users to read backup settings"
  ON backup_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow only authenticated users to update backup settings
CREATE POLICY "Allow authenticated users to update backup settings"
  ON backup_settings
  FOR UPDATE
  TO authenticated
  USING (true);

-- Allow only authenticated users to insert backup settings
CREATE POLICY "Allow authenticated users to insert backup settings"
  ON backup_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow only authenticated users to read backups
CREATE POLICY "Allow authenticated users to read backups"
  ON backups
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow only authenticated users to insert backups
CREATE POLICY "Allow authenticated users to insert backups"
  ON backups
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow only authenticated users to delete backups
CREATE POLICY "Allow authenticated users to delete backups"
  ON backups
  FOR DELETE
  TO authenticated
  USING (true); 