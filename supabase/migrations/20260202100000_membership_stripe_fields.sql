-- Membership Stripe Integration Migration
-- Adds stripe-specific fields and tables for subscription management
-- Date: 2026-02-02

-- ============================================
-- 1. Add Stripe fields to collector_credit_subscriptions
-- ============================================

ALTER TABLE public.collector_credit_subscriptions
ADD COLUMN IF NOT EXISTS stripe_subscription_id text UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_price_id text,
ADD COLUMN IF NOT EXISTS current_period_start timestamptz,
ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- Index for Stripe subscription lookups
CREATE INDEX IF NOT EXISTS idx_collector_credit_subscriptions_stripe_sub_id 
  ON public.collector_credit_subscriptions(stripe_subscription_id) 
  WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_collector_credit_subscriptions_stripe_customer 
  ON public.collector_credit_subscriptions(stripe_customer_id) 
  WHERE stripe_customer_id IS NOT NULL;

-- ============================================
-- 2. Add stripe_customer_id to collectors table
-- ============================================

ALTER TABLE public.collectors
ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_collectors_stripe_customer 
  ON public.collectors(stripe_customer_id) 
  WHERE stripe_customer_id IS NOT NULL;

-- ============================================
-- 3. Add 'appreciation' to transaction type enum
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'appreciation' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'collector_transaction_type')
  ) THEN
    ALTER TYPE collector_transaction_type ADD VALUE IF NOT EXISTS 'appreciation';
  END IF;
END $$;

-- ============================================
-- 4. Create checkout_sessions table for idempotency
-- ============================================

CREATE TABLE IF NOT EXISTS public.checkout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE, -- Stripe checkout session ID
  collector_id uuid REFERENCES public.collectors(id),
  collector_identifier text NOT NULL,
  session_type text NOT NULL CHECK (session_type IN ('subscription', 'one_time', 'hybrid')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'failed')),
  
  -- Cart data
  line_items jsonb NOT NULL DEFAULT '[]',
  credits_used integer DEFAULT 0,
  subtotal_cents integer NOT NULL,
  credits_discount_cents integer DEFAULT 0,
  stripe_charge_cents integer NOT NULL,
  
  -- Stripe references
  stripe_payment_intent_id text,
  stripe_subscription_id text,
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_collector 
  ON public.checkout_sessions(collector_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_session_id 
  ON public.checkout_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_status 
  ON public.checkout_sessions(status) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own checkout sessions
CREATE POLICY "Users can view their own checkout sessions"
  ON public.checkout_sessions FOR SELECT
  USING (collector_identifier = auth.jwt() ->> 'email');

-- Service role can manage all
CREATE POLICY "Service role can manage checkout sessions"
  ON public.checkout_sessions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- 5. Create webhook_events table for idempotency
-- ============================================

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE, -- Stripe event ID
  event_type text NOT NULL,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  payload jsonb NOT NULL,
  error text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id 
  ON public.webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed 
  ON public.webhook_events(processed) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_webhook_events_created 
  ON public.webhook_events(created_at DESC);

-- Enable RLS (admin only)
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhook events"
  ON public.webhook_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
        AND ur.is_active = true
    )
  );

-- ============================================
-- 6. Create membership_analytics table
-- ============================================

CREATE TABLE IF NOT EXISTS public.membership_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  
  -- Subscription metrics
  total_active_subscriptions integer DEFAULT 0,
  new_subscriptions integer DEFAULT 0,
  cancelled_subscriptions integer DEFAULT 0,
  churned_subscriptions integer DEFAULT 0,
  
  -- Revenue metrics
  mrr_cents integer DEFAULT 0, -- Monthly Recurring Revenue
  arr_cents integer DEFAULT 0, -- Annual Recurring Revenue
  
  -- Credit metrics
  total_credits_deposited integer DEFAULT 0,
  total_credits_redeemed integer DEFAULT 0,
  total_credits_appreciated integer DEFAULT 0,
  
  -- Tier breakdown
  tier_collector_count integer DEFAULT 0,
  tier_curator_count integer DEFAULT 0,
  tier_founding_count integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(date)
);

CREATE INDEX IF NOT EXISTS idx_membership_analytics_date 
  ON public.membership_analytics(date DESC);

-- Enable RLS (admin only)
ALTER TABLE public.membership_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view membership analytics"
  ON public.membership_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
        AND ur.is_active = true
    )
  );

CREATE POLICY "Service role can manage membership analytics"
  ON public.membership_analytics FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- 7. Add membership permissions to role_permissions
-- ============================================

INSERT INTO public.role_permissions (role, permission, resource_type, description) VALUES
  -- Collector membership permissions
  ('collector', 'membership:view', 'membership', 'View membership status and credits'),
  ('collector', 'membership:subscribe', 'membership', 'Subscribe to membership tiers'),
  ('collector', 'membership:manage', 'membership', 'Manage subscription (upgrade, downgrade, cancel)'),
  ('collector', 'credits:view', 'credits', 'View credit balance and transactions'),
  ('collector', 'credits:redeem', 'credits', 'Use credits for purchases'),
  ('collector', 'checkout:member', 'checkout', 'Access member checkout with credits'),
  
  -- Admin membership permissions
  ('admin', 'membership:admin', 'membership', 'Admin access to all membership features'),
  ('admin', 'credits:admin', 'credits', 'Admin access to credit operations (deposit, adjust)')
ON CONFLICT (role, permission) DO NOTHING;

-- ============================================
-- 8. Add credit_source column to ledger entries
-- ============================================

ALTER TABLE public.collector_ledger_entries
ADD COLUMN IF NOT EXISTS credit_source text CHECK (credit_source IN ('subscription', 'purchase', 'bonus', 'refund', 'adjustment', 'appreciation'));

-- Update existing subscription deposits to have source
UPDATE public.collector_ledger_entries
SET credit_source = 'subscription'
WHERE transaction_type = 'deposit' AND credit_source IS NULL;

-- ============================================
-- Comments for documentation
-- ============================================

COMMENT ON TABLE public.checkout_sessions IS 'Tracks checkout sessions for idempotency and cart persistence';
COMMENT ON TABLE public.webhook_events IS 'Stores processed webhook events for idempotency';
COMMENT ON TABLE public.membership_analytics IS 'Daily aggregated membership and credit metrics';

COMMENT ON COLUMN public.collector_credit_subscriptions.stripe_subscription_id IS 'Stripe subscription ID for this membership';
COMMENT ON COLUMN public.collector_credit_subscriptions.current_period_end IS 'When the current billing period ends';
COMMENT ON COLUMN public.collector_ledger_entries.credit_source IS 'Source of credits: subscription, purchase, bonus, refund, adjustment, appreciation';
