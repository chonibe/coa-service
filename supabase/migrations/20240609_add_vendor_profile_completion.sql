-- Add profile completion tracking columns to vendors table
ALTER TABLE vendors 
ADD COLUMN profile_completed BOOLEAN DEFAULT false,
ADD COLUMN profile_completion_date TIMESTAMP WITH TIME ZONE;

-- Create an index for faster querying of completed profiles
CREATE INDEX idx_vendor_profile_completed ON vendors(profile_completed);

-- Trigger to update profile completion status
CREATE OR REPLACE FUNCTION update_vendor_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if bio and at least one artwork story are completed
  IF NEW.bio IS NOT NULL AND NEW.bio != '' THEN
    NEW.profile_completed = (
      EXISTS (
        SELECT 1 
        FROM order_line_items 
        WHERE vendor_id = NEW.id 
        AND artwork_story_status = 'completed'
      )
    );
    
    IF NEW.profile_completed THEN
      NEW.profile_completion_date = CURRENT_TIMESTAMP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vendor_profile_completion_trigger
BEFORE UPDATE ON vendors
FOR EACH ROW
EXECUTE FUNCTION update_vendor_profile_completion(); 