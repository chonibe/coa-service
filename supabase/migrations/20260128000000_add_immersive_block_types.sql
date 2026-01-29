-- Add new immersive block types for artwork pages
-- These enable artists to create rich, multimedia experiences

INSERT INTO benefit_types (name, description) VALUES
('Artwork Soundtrack Block', 'Spotify track with optional artist note'),
('Artwork Voice Note Block', 'Artist audio message with optional transcript'),
('Artwork Process Gallery Block', 'Ordered images showing creation process with captions'),
('Artwork Inspiration Block', 'Mood board images with story text'),
('Artwork Artist Note Block', 'Personal letter from artist with optional signature')
ON CONFLICT (name) DO NOTHING;
