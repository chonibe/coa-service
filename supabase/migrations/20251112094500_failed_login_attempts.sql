CREATE TABLE IF NOT EXISTS public.failed_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  method text NOT NULL,
  reason text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS failed_login_attempts_created_at_idx ON public.failed_login_attempts (created_at DESC);
CREATE INDEX IF NOT EXISTS failed_login_attempts_email_idx ON public.failed_login_attempts (lower(email));
