-- Migration: Create nfc_tag_scans table
-- The redirect route inserts into this table to track every physical NFC scan.

CREATE TABLE IF NOT EXISTS nfc_tag_scans (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tag_id        text NOT NULL REFERENCES nfc_tags(tag_id) ON DELETE CASCADE,
  scanned_at    timestamptz NOT NULL DEFAULT now(),
  ip_address    text,
  user_agent    text
);
-- Index for fast tag-level lookups
CREATE INDEX IF NOT EXISTS idx_nfc_tag_scans_tag_id ON nfc_tag_scans(tag_id);
-- Index for time-range queries / analytics
CREATE INDEX IF NOT EXISTS idx_nfc_tag_scans_scanned_at ON nfc_tag_scans(scanned_at);
-- Enable RLS (deny by default — admin access only via service role key)
ALTER TABLE nfc_tag_scans ENABLE ROW LEVEL SECURITY;
