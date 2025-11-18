-- Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Vendor status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vendor_status') THEN
    CREATE TYPE public.vendor_status AS ENUM ('pending', 'active', 'review', 'disabled', 'suspended');
  END IF;
END$$;

ALTER TYPE public.vendor_status ADD VALUE IF NOT EXISTS 'review';
ALTER TYPE public.vendor_status ADD VALUE IF NOT EXISTS 'disabled';
ALTER TYPE public.vendor_status ADD VALUE IF NOT EXISTS 'suspended';

-- Extend vendors table
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS status public.vendor_status DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS onboarded_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

-- Vendor users mapping table
CREATE TABLE IF NOT EXISTS public.vendor_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id integer NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  auth_id uuid UNIQUE,
  email text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vendor_users_vendor_id_idx ON public.vendor_users (vendor_id);
CREATE UNIQUE INDEX IF NOT EXISTS vendor_users_email_idx ON public.vendor_users (lower(email)) WHERE email IS NOT NULL;

-- Admin accounts mapping table
CREATE TABLE IF NOT EXISTS public.admin_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid UNIQUE,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Seed known administrator emails
INSERT INTO public.admin_accounts (email)
VALUES ('choni@thestreetlamp.com'), ('chonibe@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Backfill vendor users from existing vendor.auth_id values
INSERT INTO public.vendor_users (vendor_id, auth_id)
SELECT id, auth_id
FROM public.vendors
WHERE auth_id IS NOT NULL
ON CONFLICT (auth_id) DO NOTHING;

-- Activate vendors already linked to a Supabase account
UPDATE public.vendors
SET status = 'active', onboarded_at = COALESCE(onboarded_at, now())
WHERE auth_id IS NOT NULL;

-- Seed vendor user mapping for Street Collector override if vendor exists
INSERT INTO public.vendor_users (vendor_id, email)
SELECT v.id, 'kinggeorgelamp@gmail.com'
FROM public.vendors v
WHERE lower(v.vendor_name) = 'street collector'
ON CONFLICT (email) DO NOTHING;
