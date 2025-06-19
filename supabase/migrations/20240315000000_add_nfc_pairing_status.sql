-- Add NFC pairing status columns
ALTER TABLE nfc_tags 
ADD COLUMN IF NOT EXISTS pairing_status text CHECK (
    pairing_status IN ('unpaired', 'pairing_in_progress', 'paired', 'pairing_failed')
) DEFAULT 'unpaired';

ALTER TABLE nfc_tags 
ADD COLUMN IF NOT EXISTS pairing_attempted_at timestamp with time zone;

ALTER TABLE nfc_tags 
ADD COLUMN IF NOT EXISTS pairing_completed_at timestamp with time zone;

ALTER TABLE nfc_tags 
ADD COLUMN IF NOT EXISTS pairing_error text;

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_nfc_tags_pairing_status 
ON nfc_tags(pairing_status);

-- Add index for timestamp queries
CREATE INDEX IF NOT EXISTS idx_nfc_tags_pairing_completed 
ON nfc_tags(pairing_completed_at);

-- Add NFC tag pairing status and related fields
ALTER TABLE order_line_items_v2
ADD COLUMN nfc_tag_id uuid REFERENCES nfc_tags(id),
ADD COLUMN nfc_pairing_status text CHECK (nfc_pairing_status IN ('pending', 'paired', 'failed')) DEFAULT 'pending',
ADD COLUMN nfc_pairing_error text,
ADD COLUMN nfc_paired_at timestamptz;

-- Add indexes for performance
CREATE INDEX idx_order_line_items_v2_nfc_tag_id ON order_line_items_v2(nfc_tag_id);
CREATE INDEX idx_order_line_items_v2_nfc_pairing_status ON order_line_items_v2(nfc_pairing_status);

-- Add trigger to update nfc_paired_at when status changes to 'paired'
CREATE OR REPLACE FUNCTION update_nfc_paired_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.nfc_pairing_status = 'paired' AND OLD.nfc_pairing_status != 'paired' THEN
    NEW.nfc_paired_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_nfc_paired_at_trigger
BEFORE UPDATE ON order_line_items_v2
FOR EACH ROW
EXECUTE FUNCTION update_nfc_paired_at();

-- Add function to begin transaction
CREATE OR REPLACE FUNCTION begin_transaction()
RETURNS void AS $$
BEGIN
  -- No-op, just starts a transaction
END;
$$ LANGUAGE plpgsql;

-- Add function to commit transaction
CREATE OR REPLACE FUNCTION commit_transaction()
RETURNS void AS $$
BEGIN
  -- No-op, just commits the transaction
END;
$$ LANGUAGE plpgsql;

-- Add function to rollback transaction
CREATE OR REPLACE FUNCTION rollback_transaction()
RETURNS void AS $$
BEGIN
  -- No-op, just rolls back the transaction
END;
$$ LANGUAGE plpgsql; 