-- Add status columns for vendor bio and artwork story
ALTER TABLE vendors 
ADD COLUMN bio_status TEXT DEFAULT 'incomplete' 
CHECK (bio_status IN ('incomplete', 'completed'));

ALTER TABLE order_line_items_v2 
ADD COLUMN artwork_story_status TEXT DEFAULT 'incomplete' 
CHECK (artwork_story_status IN ('incomplete', 'completed'));

-- Trigger to update bio status when bio is added
CREATE OR REPLACE FUNCTION update_bio_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.bio IS NOT NULL AND NEW.bio != '' THEN
    NEW.bio_status = 'completed';
  ELSE
    NEW.bio_status = 'incomplete';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendor_bio_status
BEFORE INSERT OR UPDATE ON vendors
FOR EACH ROW
EXECUTE FUNCTION update_bio_status();

-- Trigger to update artwork story status when story is added
CREATE OR REPLACE FUNCTION update_artwork_story_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.artwork_story IS NOT NULL AND NEW.artwork_story != '' THEN
    NEW.artwork_story_status = 'completed';
  ELSE
    NEW.artwork_story_status = 'incomplete';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_order_line_item_artwork_story_status
BEFORE INSERT OR UPDATE ON order_line_items_v2
FOR EACH ROW
EXECUTE FUNCTION update_artwork_story_status(); 