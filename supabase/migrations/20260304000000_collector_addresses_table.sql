-- Multi-address support for collectors.
-- Replaces single default_shipping_address/default_billing_address with an address book.

CREATE TABLE IF NOT EXISTS "public"."collector_addresses" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "address" JSONB NOT NULL,
  "label" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collector_addresses_user_id
  ON "public"."collector_addresses"("user_id");

COMMENT ON TABLE "public"."collector_addresses" IS 'Saved addresses for collectors; used at checkout and in account.';
COMMENT ON COLUMN "public"."collector_addresses"."address" IS 'CheckoutAddress-format JSON (email, fullName, addressLine1, etc.).';
COMMENT ON COLUMN "public"."collector_addresses"."label" IS 'Optional label (e.g. Home, Work) to distinguish addresses.';

-- RLS
ALTER TABLE "public"."collector_addresses" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own addresses" ON "public"."collector_addresses";
CREATE POLICY "Users can view own addresses" ON "public"."collector_addresses"
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own addresses" ON "public"."collector_addresses";
CREATE POLICY "Users can insert own addresses" ON "public"."collector_addresses"
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own addresses" ON "public"."collector_addresses";
CREATE POLICY "Users can update own addresses" ON "public"."collector_addresses"
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own addresses" ON "public"."collector_addresses";
CREATE POLICY "Users can delete own addresses" ON "public"."collector_addresses"
  FOR DELETE USING (auth.uid() = user_id);

-- Migrate existing default addresses from collector_profiles
INSERT INTO "public"."collector_addresses" ("user_id", "address", "label")
SELECT
  cp.user_id,
  cp.default_shipping_address,
  'Shipping'
FROM "public"."collector_profiles" cp
WHERE cp.user_id IS NOT NULL
  AND cp.default_shipping_address IS NOT NULL
  AND jsonb_typeof(cp.default_shipping_address) = 'object'
  AND (cp.default_shipping_address->>'addressLine1') IS NOT NULL
;

INSERT INTO "public"."collector_addresses" ("user_id", "address", "label")
SELECT
  cp.user_id,
  cp.default_billing_address,
  'Billing'
FROM "public"."collector_profiles" cp
WHERE cp.user_id IS NOT NULL
  AND cp.default_billing_address IS NOT NULL
  AND jsonb_typeof(cp.default_billing_address) = 'object'
  AND (cp.default_billing_address->>'addressLine1') IS NOT NULL
  AND (cp.default_billing_address IS DISTINCT FROM cp.default_shipping_address);
