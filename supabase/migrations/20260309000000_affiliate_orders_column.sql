-- Add affiliate_vendor_id to orders for tracking artist referrals
-- When a customer buys via an artist's affiliate link, we store the referring vendor here

ALTER TABLE "public"."orders"
ADD COLUMN IF NOT EXISTS "affiliate_vendor_id" INTEGER REFERENCES "public"."vendors"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_affiliate_vendor_id ON "public"."orders"("affiliate_vendor_id") WHERE affiliate_vendor_id IS NOT NULL;

COMMENT ON COLUMN "public"."orders"."affiliate_vendor_id" IS 'Vendor (artist) whose affiliate link referred this order. Used for 10% lamp commission.';
