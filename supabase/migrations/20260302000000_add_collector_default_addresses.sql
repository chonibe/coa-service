-- Add default shipping and billing address JSONB columns to collector_profiles.
-- Users can add/edit addresses in account settings; these are used to prefill checkout.

ALTER TABLE "public"."collector_profiles"
  ADD COLUMN IF NOT EXISTS "default_shipping_address" JSONB,
  ADD COLUMN IF NOT EXISTS "default_billing_address" JSONB;

COMMENT ON COLUMN "public"."collector_profiles"."default_shipping_address" IS 'Default shipping address (CheckoutAddress format) for prefill at checkout and display in account.';
COMMENT ON COLUMN "public"."collector_profiles"."default_billing_address" IS 'Default billing address (CheckoutAddress format) for prefill at checkout and display in account.';
