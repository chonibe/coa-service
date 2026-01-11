-- Migration: Ink-O-Gatchi Gamification System
-- Integrates with existing collector banking system

-- 1. Add new transaction types to the existing enum
ALTER TYPE collector_transaction_type ADD VALUE IF NOT EXISTS 'nfc_scan_reward';
ALTER TYPE collector_transaction_type ADD VALUE IF NOT EXISTS 'series_completion_reward';
ALTER TYPE collector_transaction_type ADD VALUE IF NOT EXISTS 'avatar_purchase';

-- 2. Create avatar_items table
CREATE TABLE IF NOT EXISTS public.avatar_items (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('base', 'hat', 'eyes', 'body', 'accessory')),
    name TEXT NOT NULL,
    asset_url TEXT NOT NULL,
    credit_cost INTEGER NOT NULL DEFAULT 0,
    required_level INTEGER NOT NULL DEFAULT 1,
    artist_id INTEGER REFERENCES public.vendors(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create collector_avatars table
CREATE TABLE IF NOT EXISTS public.collector_avatars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    equipped_items JSONB NOT NULL DEFAULT '{}'::jsonb, -- Map of { 'hat': id, 'eyes': id, etc. }
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 4. Create collector_avatar_inventory table
CREATE TABLE IF NOT EXISTS public.collector_avatar_inventory (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES public.avatar_items(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

-- 5. Add triggers for updated_at
CREATE TRIGGER update_collector_avatars_updated_at
    BEFORE UPDATE ON collector_avatars
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Insert initial "Base" items for the Spray Can evolution stages
-- These are the free evolution bases
INSERT INTO public.avatar_items (type, name, asset_url, credit_cost, required_level)
VALUES 
    ('base', 'Rookie Can', '/assets/avatars/base_stage_1.svg', 0, 1),
    ('base', 'Tagger Can', '/assets/avatars/base_stage_2.svg', 0, 5),
    ('base', 'Artist Can', '/assets/avatars/base_stage_3.svg', 0, 10),
    ('base', 'Legend Can', '/assets/avatars/base_stage_4.svg', 0, 20)
ON CONFLICT DO NOTHING;

-- 7. Insert some starting cosmetic items
INSERT INTO public.avatar_items (type, name, asset_url, credit_cost, required_level)
VALUES 
    ('hat', 'Red Cap', '/assets/avatars/items/hat_red_cap.svg', 100, 1),
    ('eyes', 'Cool Shades', '/assets/avatars/items/eyes_shades.svg', 250, 2),
    ('body', 'Gold Chain', '/assets/avatars/items/body_chain.svg', 500, 5)
ON CONFLICT DO NOTHING;

