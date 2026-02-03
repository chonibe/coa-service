-- Migration: Create order_status_notes table for tracking shipping status history
-- This table stores status change events for orders, enabling admin visibility
-- and preventing duplicate notifications for the same status.

CREATE TABLE IF NOT EXISTS order_status_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL,           -- Shopify order ID or warehouse order ID
  order_name TEXT,                  -- e.g., #1174
  status_code INTEGER,              -- China Division warehouse status code (0=Approving, 3=Shipped, etc.)
  status_name TEXT,                 -- Human-readable warehouse status
  track_status_code INTEGER,        -- Tracking status code (101=In Transit, 112=Out for Delivery, 121=Delivered, etc.)
  track_status_name TEXT,           -- Human-readable tracking status
  tracking_number TEXT,
  note TEXT,                        -- Auto-generated note text describing the status change
  source TEXT DEFAULT 'auto',       -- Source of the note: 'auto' (system), 'manual' (admin), 'webhook'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_order_status_notes_order_id ON order_status_notes(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_notes_order_name ON order_status_notes(order_name);
CREATE INDEX IF NOT EXISTS idx_order_status_notes_created_at ON order_status_notes(created_at DESC);

-- Add RLS policies
ALTER TABLE order_status_notes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read notes (admins will have access)
CREATE POLICY "Allow authenticated read access to order_status_notes"
  ON order_status_notes
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access to order_status_notes"
  ON order_status_notes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE order_status_notes IS 'Stores shipping status change history for orders, used for admin visibility and notification tracking';
COMMENT ON COLUMN order_status_notes.order_id IS 'Shopify order ID or warehouse order ID (e.g., WH-12345)';
COMMENT ON COLUMN order_status_notes.order_name IS 'Human-readable order name (e.g., #1174)';
COMMENT ON COLUMN order_status_notes.status_code IS 'China Division warehouse status: 0=Approving, 3=Shipped, 11=Uploaded, 23=Canceled';
COMMENT ON COLUMN order_status_notes.track_status_code IS 'Tracking status: 101=In Transit, 111=Pick Up, 112=Out for Delivery, 121=Delivered, 131=Alert, 132=Expired';
COMMENT ON COLUMN order_status_notes.source IS 'Origin of the note: auto (system-generated), manual (admin-added), webhook (from external system)';
