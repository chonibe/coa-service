-- Migration: Create Edition Events Table
-- Immutable event log for edition number provenance tracking
-- Matches pattern used in collector_ledger_entries

CREATE TABLE IF NOT EXISTS edition_events (
  id BIGSERIAL PRIMARY KEY,
  line_item_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  edition_number INTEGER NOT NULL,
  
  -- Event Details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'edition_assigned',
    'nfc_authenticated',
    'ownership_transfer',
    'status_changed',
    'certificate_generated',
    'edition_revoked'
  )),
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Ownership Info (snapshot at time of event)
  owner_name TEXT,
  owner_email TEXT,
  owner_id TEXT,
  
  -- Status Info (snapshot at time of event)
  fulfillment_status TEXT,
  status TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_edition_events_line_item 
  ON edition_events(line_item_id, created_at);

CREATE INDEX IF NOT EXISTS idx_edition_events_product_edition 
  ON edition_events(product_id, edition_number);

CREATE INDEX IF NOT EXISTS idx_edition_events_type 
  ON edition_events(event_type);

CREATE INDEX IF NOT EXISTS idx_edition_events_owner 
  ON edition_events(owner_id) 
  WHERE owner_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_edition_events_created_at 
  ON edition_events(created_at DESC);

-- Add comment to table
COMMENT ON TABLE edition_events IS 'Immutable event log for edition number provenance. Tracks all events related to edition assignment, authentication, ownership transfers, and status changes.';

