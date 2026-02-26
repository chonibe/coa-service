-- Apply checkout_sessions table (from 20260202100000_membership_stripe_fields.sql)
-- Run this in Supabase Dashboard → SQL Editor if the table doesn't exist
-- Error: "Could not find the table 'public.checkout_sessions' in the schema cache"

CREATE TABLE IF NOT EXISTS public.checkout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  collector_id uuid REFERENCES public.collectors(id),
  collector_identifier text NOT NULL,
  session_type text NOT NULL CHECK (session_type IN ('subscription', 'one_time', 'hybrid')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'failed')),
  line_items jsonb NOT NULL DEFAULT '[]',
  credits_used integer DEFAULT 0,
  subtotal_cents integer NOT NULL,
  credits_discount_cents integer DEFAULT 0,
  stripe_charge_cents integer NOT NULL,
  stripe_payment_intent_id text,
  stripe_subscription_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_collector ON public.checkout_sessions(collector_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_session_id ON public.checkout_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_status ON public.checkout_sessions(status) WHERE status = 'pending';

ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own checkout sessions" ON public.checkout_sessions;
CREATE POLICY "Users can view their own checkout sessions"
  ON public.checkout_sessions FOR SELECT
  USING (collector_identifier = auth.jwt() ->> 'email');

DROP POLICY IF EXISTS "Service role can manage checkout sessions" ON public.checkout_sessions;
CREATE POLICY "Service role can manage checkout sessions"
  ON public.checkout_sessions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
