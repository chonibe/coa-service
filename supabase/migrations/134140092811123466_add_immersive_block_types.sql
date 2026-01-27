
INSERT INTO benefit_types (name, description, config_schema) VALUES
('Artwork Soundtrack Block', 'Spotify track with optional note', '{ "spotify_url": { "type": "string" }, "note": { "type": "string", "nullable": true } }'),
('Artwork Voice Note Block', 'Artist audio messages with title/transcript', '{ "title": { "type": "string" }, "transcript": { "type": "string", "nullable": true } }'),
('Artwork Process Gallery Block', 'Ordered images with captions showing creation process', '{ "intro": { "type": "string", "nullable": true }, "images": { "type": "array", "items": { "type": "object", "properties": { "url": { "type": "string" }, "caption": { "type": "string", "nullable": true }, "order": { "type": "number" } }, "required": ["url", "order"] } } }'),
('Artwork Inspiration Block', 'Mood board images with story text', '{ "story": { "type": "string", "nullable": true }, "images": { "type": "array", "items": { "type": "object", "properties": { "url": { "type": "string" }, "caption": { "type": "string", "nullable": true } }, "required": ["url"] } } }');
