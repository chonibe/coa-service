-- The Reserve: subscription tier + per-artwork price locks (Street Collector roadmap Phase 3)
-- Webhook (service role) writes subscriptions; authenticated users manage their own locks via RLS.

CREATE TABLE IF NOT EXISTS public.street_reserve_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  tier text NOT NULL CHECK (tier IN ('collector', 'curator', 'patron')),
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text,
  status text NOT NULL DEFAULT 'active',
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.street_reserve_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  customer_email text,
  shopify_product_id text NOT NULL,
  locked_price_cents integer NOT NULL CHECK (locked_price_cents > 0),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, shopify_product_id)
);

CREATE INDEX IF NOT EXISTS idx_street_reserve_locks_expires ON public.street_reserve_locks (expires_at);
CREATE INDEX IF NOT EXISTS idx_street_reserve_locks_email_lower ON public.street_reserve_locks (lower(customer_email));

ALTER TABLE public.street_reserve_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.street_reserve_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "street_reserve_subscriptions_select_own"
  ON public.street_reserve_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "street_reserve_locks_select_own"
  ON public.street_reserve_locks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "street_reserve_locks_insert_own"
  ON public.street_reserve_locks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "street_reserve_locks_update_own"
  ON public.street_reserve_locks FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "street_reserve_locks_delete_own"
  ON public.street_reserve_locks FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT ON public.street_reserve_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.street_reserve_locks TO authenticated;
GRANT ALL ON public.street_reserve_subscriptions TO service_role;
GRANT ALL ON public.street_reserve_locks TO service_role;

COMMENT ON TABLE public.street_reserve_subscriptions IS 'Stripe-backed The Reserve membership; populated via Stripe subscription webhooks.';
COMMENT ON TABLE public.street_reserve_locks IS 'Frozen artwork list price (cents USD) until expires_at; checkout should honor while valid.';
