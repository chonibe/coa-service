-- Migration: Edition Events Immutability Protection
-- Reuses existing protect_ledger_immutability function from collector_ledger_entries
-- Ensures edition_events table is append-only for audit trail integrity

-- The protect_ledger_immutability function should already exist from collector_ledger_entries
-- If it doesn't exist, create it
CREATE OR REPLACE FUNCTION protect_ledger_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Deleting ledger entries is strictly forbidden for compliance.';
  ELSIF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'Updating ledger entries is strictly forbidden. Corrections must be made via reversal entries.';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to protect edition_events from updates and deletes
DROP TRIGGER IF EXISTS trg_protect_edition_events_immutability ON edition_events;
CREATE TRIGGER trg_protect_edition_events_immutability
BEFORE UPDATE OR DELETE ON edition_events
FOR EACH ROW EXECUTE FUNCTION protect_ledger_immutability();

-- Add comment
COMMENT ON TRIGGER trg_protect_edition_events_immutability ON edition_events IS 'Prevents updates and deletes to edition_events table to ensure audit trail integrity.';

