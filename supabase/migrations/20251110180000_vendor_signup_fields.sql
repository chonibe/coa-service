-- Add onboarding fields to vendors for Google OAuth pairing/sign-up
ALTER TABLE public.vendors
ADD COLUMN IF NOT EXISTS signup_status text NOT NULL DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS auth_pending_email text,
ADD COLUMN IF NOT EXISTS invite_code text;

-- Ensure existing records default to completed status
UPDATE public.vendors
SET signup_status = 'completed'
WHERE signup_status IS NULL;

-- Maintain unique mapping from pending email to vendor
CREATE UNIQUE INDEX IF NOT EXISTS vendors_auth_pending_email_key
ON public.vendors (auth_pending_email)
WHERE auth_pending_email IS NOT NULL;

-- Optional invite code lookup
CREATE UNIQUE INDEX IF NOT EXISTS vendors_invite_code_key
ON public.vendors (invite_code)
WHERE invite_code IS NOT NULL;

-- Useful for querying pending approvals
CREATE INDEX IF NOT EXISTS vendors_signup_status_idx
ON public.vendors (signup_status);

