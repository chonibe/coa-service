-- Migration: Update benefit types for circular benefits system
-- Remove Physical Item and Virtual Event, add new circular benefit types

-- Remove Physical Item and Virtual Event benefit types
DELETE FROM benefit_types WHERE name IN ('Physical Item', 'Virtual Event');

-- Add new circular benefit types if they don't exist
INSERT INTO benefit_types (name, description, icon)
VALUES 
    ('Hidden Series', 'Unlock access to a hidden series only available to collectors who purchase this artwork', 'lock'),
    ('VIP Artwork Unlock', 'Unlock a specific artwork from a VIP series', 'crown'),
    ('Credits Bonus', 'Grant credits towards next artwork or series purchase', 'coins'),
    ('Early Drop Access', 'Get early access to the next drop date before public release', 'clock'),
    ('Exclusive Visibility', 'See series or artwork only visible to perk holders', 'eye')
ON CONFLICT (name) DO NOTHING;

-- Update existing benefit types descriptions to be more circular-focused
UPDATE benefit_types 
SET description = 'Digital files such as PDFs, videos, or images that collectors can access'
WHERE name = 'Digital Content';

UPDATE benefit_types 
SET description = 'Early or exclusive access to content, products, or features that connect to your artwork ecosystem'
WHERE name = 'Exclusive Access';

UPDATE benefit_types 
SET description = 'Behind-the-scenes content showing your artistic process and journey'
WHERE name = 'Behind the Scenes';

UPDATE benefit_types 
SET description = 'Special discounts on future purchases to encourage repeat collecting'
WHERE name = 'Discount';

