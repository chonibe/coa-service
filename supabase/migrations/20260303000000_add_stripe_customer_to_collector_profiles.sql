-- Add stripe_customer_id to collector_profiles for payment method persistence.
-- When users pay, Stripe attaches the payment method to this customer; on return we
-- pass customer so they can reuse saved cards without re-entering.

ALTER TABLE "public"."collector_profiles"
  ADD COLUMN IF NOT EXISTS "stripe_customer_id" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_collector_profiles_stripe_customer
  ON "public"."collector_profiles"("stripe_customer_id")
  WHERE stripe_customer_id IS NOT NULL;

COMMENT ON COLUMN "public"."collector_profiles"."stripe_customer_id" IS 'Stripe Customer ID for saved payment methods; enables Link/card reuse on return purchases.';
