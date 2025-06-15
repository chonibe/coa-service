-- Create NFC Tag Audit Log Table
CREATE TABLE nfc_tag_audit_log (
  id SERIAL PRIMARY KEY,
  action VARCHAR(255) NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: Create an index for faster querying
CREATE INDEX idx_nfc_tag_audit_log_action ON nfc_tag_audit_log(action);
CREATE INDEX idx_nfc_tag_audit_log_created_at ON nfc_tag_audit_log(created_at); 