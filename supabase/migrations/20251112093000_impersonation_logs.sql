CREATE TABLE IF NOT EXISTS public.impersonation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email text NOT NULL,
  vendor_id integer,
  vendor_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS impersonation_logs_created_at_idx ON public.impersonation_logs (created_at DESC);
