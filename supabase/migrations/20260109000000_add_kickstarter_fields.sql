-- Migration: Add Kickstarter Backer fields
-- For collector profiles
ALTER TABLE "public"."collector_profiles" ADD COLUMN IF NOT EXISTS "is_kickstarter_backer" BOOLEAN DEFAULT FALSE;

-- For orders
ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "kickstarter_backing_amount_gbp" DECIMAL(10, 2);
ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "kickstarter_backing_amount_usd" DECIMAL(10, 2);

-- Add comments for clarity
COMMENT ON COLUMN "public"."collector_profiles"."is_kickstarter_backer" IS 'Indicates if the collector was a backer of the original Kickstarter campaign.';
COMMENT ON COLUMN "public"."orders"."kickstarter_backing_amount_gbp" IS 'The original backing amount in GBP from the Kickstarter campaign.';
COMMENT ON COLUMN "public"."orders"."kickstarter_backing_amount_usd" IS 'The Kickstarter backing amount converted to USD.';


