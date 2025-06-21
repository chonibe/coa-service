-- Create product_stories table
CREATE TABLE product_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  story_text TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  location TEXT,
  collaborators TEXT[] DEFAULT '{}',
  image_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Optional: Add row-level security
  CONSTRAINT story_text_length CHECK (length(story_text) BETWEEN 10 AND 1000)
);

-- Enable Row Level Security
ALTER TABLE product_stories ENABLE ROW LEVEL SECURITY;

-- Policy to allow vendors to manage their own stories
CREATE POLICY "Vendors can manage their product stories" 
ON product_stories 
FOR ALL 
USING (
  (SELECT vendor_id FROM products WHERE id = product_id) = auth.uid()
);

-- Optional: Create index for performance
CREATE INDEX idx_product_stories_product_id ON product_stories(product_id);

-- Optional: Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_stories_modtime
BEFORE UPDATE ON product_stories
FOR EACH ROW
EXECUTE FUNCTION update_modified_column(); 