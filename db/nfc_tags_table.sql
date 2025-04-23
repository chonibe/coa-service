-- Create nfc_tags table if it doesn't exist
CREATE TABLE IF NOT EXISTS nfc_tags (
  id SERIAL PRIMARY KEY,
  tag_id VARCHAR(255) NOT NULL UNIQUE,
  line_item_id VARCHAR(255),
  order_id VARCHAR(255),
  certificate_url TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'unassigned',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  programmed_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (line_item_id, order_id) REFERENCES order_line_items (line_item_id, order_id) ON DELETE SET NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_nfc_tags_tag_id ON nfc_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_nfc_tags_line_item_id ON nfc_tags(line_item_id);
CREATE INDEX IF NOT EXISTS idx_nfc_tags_status ON nfc_tags(status);
