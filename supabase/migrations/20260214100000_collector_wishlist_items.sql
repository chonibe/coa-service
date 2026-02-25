-- Migration: Create collector_wishlist_items table
-- Purpose: Server-side wishlist persistence for cross-device sync
-- Feature: Stream C2 — Server-Synced Wishlist

CREATE TABLE IF NOT EXISTS public.collector_wishlist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  collector_identifier TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  handle TEXT NOT NULL,
  title TEXT NOT NULL,
  price NUMERIC(10, 2) DEFAULT 0,
  image TEXT,
  artist_name TEXT,
  notify_restock BOOLEAN DEFAULT FALSE,
  notify_price_drop BOOLEAN DEFAULT FALSE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  removed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate active wishlist items per user+product
  CONSTRAINT unique_active_wishlist_item UNIQUE NULLS NOT DISTINCT (user_id, product_id, removed_at)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.collector_wishlist_items(user_id) WHERE removed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_wishlist_collector_id ON public.collector_wishlist_items(collector_identifier) WHERE removed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON public.collector_wishlist_items(product_id) WHERE removed_at IS NULL;

-- Enable RLS
ALTER TABLE public.collector_wishlist_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own wishlist items
CREATE POLICY "Users can view their own wishlist"
  ON public.collector_wishlist_items
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wishlist items"
  ON public.collector_wishlist_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wishlist items"
  ON public.collector_wishlist_items
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wishlist items"
  ON public.collector_wishlist_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role bypass (for admin operations)
CREATE POLICY "Service role full access to wishlist"
  ON public.collector_wishlist_items
  FOR ALL
  USING (auth.role() = 'service_role');

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_wishlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wishlist_updated_at_trigger
  BEFORE UPDATE ON public.collector_wishlist_items
  FOR EACH ROW
  EXECUTE FUNCTION update_wishlist_updated_at();

-- Comment on table
COMMENT ON TABLE public.collector_wishlist_items IS 'Server-synced wishlist items for collectors. localStorage serves as offline cache; server is source of truth for authenticated users.';
