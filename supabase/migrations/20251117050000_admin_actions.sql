CREATE TABLE IF NOT EXISTS public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email text NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('view', 'update', 'delete', 'create')),
  vendor_id integer,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_actions_created_at_idx ON public.admin_actions (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_actions_admin_email_idx ON public.admin_actions (admin_email);
CREATE INDEX IF NOT EXISTS admin_actions_vendor_id_idx ON public.admin_actions (vendor_id);
CREATE INDEX IF NOT EXISTS admin_actions_action_type_idx ON public.admin_actions (action_type);

