-- Create artwork_slides table for Reels-style slide editor
-- Each slide has a background, freely positioned elements, title/caption, and optional audio

CREATE TABLE IF NOT EXISTS artwork_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  
  -- Background layer (JSONB)
  -- { type: 'image'|'video'|'gradient'|'solid', url?, value?, scale, offsetX, offsetY }
  background JSONB NOT NULL DEFAULT '{"type": "gradient", "value": "dark", "scale": 1, "offsetX": 0, "offsetY": 0}',
  
  -- Canvas elements (JSONB array of CanvasElement)
  -- Each element: { id, type: 'text'|'image', x, y, scale, rotation, width, height, content, style? }
  elements JSONB DEFAULT '[]',
  
  -- Title + Caption (suggested via pill bar, fully editable)
  title TEXT,                 -- "The Story", "Process", etc. or custom
  caption TEXT,               -- Free-form text below title
  
  -- Audio layer (JSONB, optional)
  -- { type: 'spotify'|'uploaded'|'voice_note', url, title? }
  audio JSONB,
  
  -- State
  is_locked BOOLEAN DEFAULT false,    -- Requires NFC authentication to view
  is_published BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient product slide queries
CREATE INDEX IF NOT EXISTS idx_artwork_slides_product_order 
  ON artwork_slides(product_id, display_order);

-- Enable RLS
ALTER TABLE artwork_slides ENABLE ROW LEVEL SECURITY;

-- Vendors can manage their own product slides
CREATE POLICY "Vendors can manage their product slides"
  ON artwork_slides FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_id AND p.vendor_id = auth.uid()::text
    )
  );

-- Anyone can view published slides
CREATE POLICY "Anyone can view published slides"
  ON artwork_slides FOR SELECT
  USING (is_published = true);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_artwork_slides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER artwork_slides_updated_at
  BEFORE UPDATE ON artwork_slides
  FOR EACH ROW
  EXECUTE FUNCTION update_artwork_slides_updated_at();

-- Grant permissions
GRANT SELECT ON artwork_slides TO anon;
GRANT ALL ON artwork_slides TO authenticated;
