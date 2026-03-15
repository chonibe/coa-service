-- Add access_token column to early_access_coupons table
-- Date: 2026-03-15

ALTER TABLE public.early_access_coupons
  ADD COLUMN IF NOT EXISTS access_token text;

-- Index for token lookups
CREATE INDEX IF NOT EXISTS idx_early_access_coupons_token ON public.early_access_coupons(access_token);

-- Add comment
COMMENT ON COLUMN public.early_access_coupons.access_token IS 'HMAC-signed token required to access this early access coupon. Links must include ?token=<access_token> to be valid.';
