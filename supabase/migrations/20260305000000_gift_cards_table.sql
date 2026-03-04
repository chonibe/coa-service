-- Gift cards: purchased via Stripe, redeemed as Stripe promotion codes at checkout.

CREATE TABLE IF NOT EXISTS "public"."gift_cards" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL UNIQUE,
  "stripe_coupon_id" TEXT,
  "stripe_promotion_code_id" TEXT,
  "amount_cents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'usd',
  "purchaser_email" TEXT NOT NULL,
  "recipient_email" TEXT,
  "status" TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'redeemed', 'provisioning_failed')),
  "stripe_session_id" TEXT,
  "error_message" TEXT,
  "purchased_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "redeemed_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_gift_cards_code ON "public"."gift_cards"("code");
CREATE INDEX IF NOT EXISTS idx_gift_cards_stripe_session ON "public"."gift_cards"("stripe_session_id");
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON "public"."gift_cards"("status");

COMMENT ON TABLE "public"."gift_cards" IS 'Gift cards sold via Stripe; redeemed as Stripe promotion codes at checkout.';
COMMENT ON COLUMN "public"."gift_cards"."status" IS 'issued: ready to redeem; redeemed: used; provisioning_failed: payment succeeded but Stripe coupon/promo creation failed.';

-- RLS: no policies = deny all for anon/auth; API routes use service role which bypasses RLS
ALTER TABLE "public"."gift_cards" ENABLE ROW LEVEL SECURITY;
