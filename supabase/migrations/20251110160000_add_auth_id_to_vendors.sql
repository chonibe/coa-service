-- Add Supabase user linkage to vendors
ALTER TABLE public.vendors
ADD COLUMN IF NOT EXISTS auth_id uuid;

-- Ensure each Supabase user links to at most one vendor
CREATE UNIQUE INDEX IF NOT EXISTS vendors_auth_id_key
ON public.vendors (auth_id)
WHERE auth_id IS NOT NULL;

