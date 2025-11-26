-- Migration for Tracking Link Labels
-- Stores labels and order-label associations for tracking links so they persist across sessions

-- Create table for labels associated with tracking links
CREATE TABLE IF NOT EXISTS tracking_link_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL,
  label_name TEXT NOT NULL,
  label_order INTEGER DEFAULT 0, -- Order position for left-to-right display
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(token, label_name),
  FOREIGN KEY (token) REFERENCES shared_order_tracking_links(token) ON DELETE CASCADE
);

-- Create table for order-label associations
CREATE TABLE IF NOT EXISTS tracking_link_order_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL,
  order_id TEXT NOT NULL, -- sys_order_id or order_id from ChinaDivision
  label_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(token, order_id, label_name),
  FOREIGN KEY (token) REFERENCES shared_order_tracking_links(token) ON DELETE CASCADE
);

-- Create table for label email notifications
CREATE TABLE IF NOT EXISTS tracking_link_label_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL,
  label_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(token, label_name, email),
  FOREIGN KEY (token) REFERENCES shared_order_tracking_links(token) ON DELETE CASCADE
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_tracking_link_labels_token ON tracking_link_labels(token);
CREATE INDEX IF NOT EXISTS idx_tracking_link_order_labels_token ON tracking_link_order_labels(token);
CREATE INDEX IF NOT EXISTS idx_tracking_link_order_labels_order_id ON tracking_link_order_labels(order_id);
CREATE INDEX IF NOT EXISTS idx_tracking_link_label_emails_token ON tracking_link_label_emails(token);
CREATE INDEX IF NOT EXISTS idx_tracking_link_label_emails_label ON tracking_link_label_emails(label_name);

-- Enable RLS
ALTER TABLE tracking_link_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_link_order_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_link_label_emails ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access (for tracking links)
CREATE POLICY "Allow public read access to tracking link labels"
  ON tracking_link_labels
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to tracking link order labels"
  ON tracking_link_order_labels
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to tracking link label emails"
  ON tracking_link_label_emails
  FOR SELECT
  USING (true);

-- Allow public insert/update/delete for tracking links (since they're shareable)
CREATE POLICY "Allow public write access to tracking link labels"
  ON tracking_link_labels
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public write access to tracking link order labels"
  ON tracking_link_order_labels
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public write access to tracking link label emails"
  ON tracking_link_label_emails
  FOR ALL
  USING (true)
  WITH CHECK (true);

