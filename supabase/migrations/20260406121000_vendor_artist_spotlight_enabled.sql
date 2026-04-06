-- Per-vendor flag: when false, vendor is excluded from automatic shop experience artist spotlight
-- (?artist= deep links still work). Default true preserves current behavior.

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS artist_spotlight_enabled boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.vendors.artist_spotlight_enabled IS
  'When false, this vendor is not chosen as the default artist spotlight on /shop/experience (affiliate ?artist= links unaffected).';
