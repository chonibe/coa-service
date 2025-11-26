-- Migration to add email notification preferences for tracking links

-- Create table for tracking link notification preferences
CREATE TABLE IF NOT EXISTS tracking_link_notification_preferences (
  id BIGSERIAL PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  email_enabled BOOLEAN DEFAULT false,
  notification_email TEXT,
  last_notified_status JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (token) REFERENCES shared_order_tracking_links(token) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tracking_notification_preferences_token ON tracking_link_notification_preferences(token);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_tracking_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tracking_notification_preferences_updated_at
  BEFORE UPDATE ON tracking_link_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_tracking_notification_preferences_updated_at();

-- Add RLS policies
ALTER TABLE tracking_link_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for notification preferences (since tracking links are public)
CREATE POLICY "Allow public access to notification preferences"
  ON tracking_link_notification_preferences
  FOR ALL
  USING (true)
  WITH CHECK (true);

