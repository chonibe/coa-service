-- Add Artwork Map Block benefit type
-- This enables artists to share meaningful locations with maps and photos

INSERT INTO benefit_types (name, description) VALUES
('Artwork Map Block', 'Location map with photos and story about a meaningful place')
ON CONFLICT (name) DO NOTHING;
