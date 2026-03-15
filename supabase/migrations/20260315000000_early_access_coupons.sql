-- Early Access Coupons Migration
-- Creates table to store early access coupons for artists
-- Date: 2026-03-15

CREATE TABLE IF NOT EXISTS public.early_access_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_slug text NOT NULL,
  vendor_id integer REFERENCES public.vendors(id),
  stripe_coupon_id text NOT NULL,
  stripe_promotion_code_id text NOT NULL,
  promotion_code text NOT NULL,
  discount_percent integer NOT NULL DEFAULT 10,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(artist_slug, stripe_coupon_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_early_access_coupons_artist_slug ON public.early_access_coupons(artist_slug);
CREATE INDEX IF NOT EXISTS idx_early_access_coupons_vendor_id ON public.early_access_coupons(vendor_id);
CREATE INDEX IF NOT EXISTS idx_early_access_coupons_promotion_code ON public.early_access_coupons(promotion_code);
CREATE INDEX IF NOT EXISTS idx_early_access_coupons_is_active ON public.early_access_coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_early_access_coupons_expires_at ON public.early_access_coupons(expires_at);

-- Enable RLS
ALTER TABLE public.early_access_coupons ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active coupons
DROP POLICY IF EXISTS "Anyone can read active early access coupons" ON public.early_access_coupons;
CREATE POLICY "Anyone can read active early access coupons" ON public.early_access_coupons
  FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Policy: Service role can manage all coupons
DROP POLICY IF EXISTS "Service role can manage early access coupons" ON public.early_access_coupons;
CREATE POLICY "Service role can manage early access coupons" ON public.early_access_coupons
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE public.early_access_coupons IS 'Stores early access discount coupons for artists. Each artist can have a 10% off coupon that is shown when early access link is accessed.';
