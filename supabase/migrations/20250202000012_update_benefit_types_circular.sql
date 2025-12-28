-- Migration: Update benefit types for circular benefits system
-- Remove Physical Item, Virtual Event, Exclusive Access, Discount, and Credits Bonus
-- Add new circular benefit types

-- Remove unwanted benefit types
DELETE FROM benefit_types WHERE name IN (
    'Physical Item', 
    'Virtual Event', 
    'Exclusive Access', 
    'Discount', 
    'Credits Bonus'
);

-- Add new circular benefit types if they don't exist
INSERT INTO benefit_types (name, description, icon)
VALUES 
    ('Hidden Series', 'Unlock access to a hidden series only available to collectors who purchase this artwork', 'lock'),
    ('VIP Artwork Unlock', 'Unlock a specific artwork from a VIP series', 'crown'),
    ('Early Drop Access', 'Get early access to the next drop date before public release', 'clock'),
    ('Exclusive Visibility', 'See series or artwork only visible to perk holders', 'eye')
ON CONFLICT (name) DO NOTHING;

-- Update existing benefit types descriptions to be more circular-focused
UPDATE benefit_types 
SET description = 'Digital files such as PDFs, videos, or images that collectors can access'
WHERE name = 'Digital Content';

UPDATE benefit_types 
SET description = 'Behind-the-scenes content showing your artistic process and journey'
WHERE name = 'Behind the Scenes';

