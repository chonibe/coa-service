-- Add new columns
ALTER TABLE "public"."order_line_items_v2"
  ADD COLUMN IF NOT EXISTS "nfc_tag_id" TEXT,
  ADD COLUMN IF NOT EXISTS "certificate_url" TEXT,
  ADD COLUMN IF NOT EXISTS "certificate_token" TEXT,
  ADD COLUMN IF NOT EXISTS "nfc_claimed_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "edition_number" INTEGER,
  ADD COLUMN IF NOT EXISTS "edition_total" INTEGER,
  ADD COLUMN IF NOT EXISTS "img_url" TEXT;

-- Update status check constraint
ALTER TABLE "public"."order_line_items_v2"
  DROP CONSTRAINT IF EXISTS "order_line_items_v2_status_check",
  ADD CONSTRAINT "order_line_items_v2_status_check" 
  CHECK (status IN ('active', 'inactive', 'refunded', 'removed')); 