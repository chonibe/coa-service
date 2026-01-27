-- Add new immersive block types for artwork pages
-- These enable artists to create rich, multimedia experiences

INSERT INTO benefit_types (name, description, config_schema) VALUES
('Artwork Soundtrack Block', 'Spotify track with optional artist note', '{"spotify_url": {"type": "string", "required": true}, "note": {"type": "string", "maxLength": 500}}'),
('Artwork Voice Note Block', 'Artist audio message with optional transcript', '{"title": {"type": "string"}, "transcript": {"type": "string"}}'),
('Artwork Process Gallery Block', 'Ordered images showing creation process with captions', '{"intro": {"type": "string"}, "images": {"type": "array", "items": {"type": "object", "properties": {"url": {"type": "string"}, "caption": {"type": "string"}, "order": {"type": "number"}}}}}'),
('Artwork Inspiration Block', 'Mood board images with story text', '{"story": {"type": "string"}, "images": {"type": "array", "items": {"type": "object", "properties": {"url": {"type": "string"}, "caption": {"type": "string"}}}}}'),
('Artwork Artist Note Block', 'Personal letter from artist with optional signature', '{"signature_url": {"type": "string"}}')
ON CONFLICT (name) DO NOTHING;
