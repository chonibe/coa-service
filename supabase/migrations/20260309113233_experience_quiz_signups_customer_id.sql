-- Add customer/collector identifiers to experience_quiz_signups so we can link signups
-- when the user logs in (collector_user_id) or completes checkout (stripe_customer_id).

ALTER TABLE public.experience_quiz_signups
  ADD COLUMN IF NOT EXISTS collector_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_experience_quiz_signups_collector_user_id
  ON public.experience_quiz_signups(collector_user_id)
  WHERE collector_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_experience_quiz_signups_stripe_customer_id
  ON public.experience_quiz_signups(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

COMMENT ON COLUMN public.experience_quiz_signups.collector_user_id IS 'Supabase auth user id; set when user logs in so we can link signup to account.';
COMMENT ON COLUMN public.experience_quiz_signups.stripe_customer_id IS 'Stripe customer id; set when user completes checkout.';

-- Allow authenticated user to update their own signup row(s) by email (link account)
CREATE POLICY "Users can link own signup by email"
  ON public.experience_quiz_signups FOR UPDATE
  USING (lower(trim(email)) = lower(trim((auth.jwt() ->> 'email'))))
  WITH CHECK (true);;
