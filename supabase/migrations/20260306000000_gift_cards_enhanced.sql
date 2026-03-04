-- Gift card enhancements: design, message, send date, sender, product-type cards.

ALTER TABLE "public"."gift_cards"
  ADD COLUMN IF NOT EXISTS "design" TEXT,
  ADD COLUMN IF NOT EXISTS "gift_message" TEXT,
  ADD COLUMN IF NOT EXISTS "send_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "sender_name" TEXT,
  ADD COLUMN IF NOT EXISTS "gift_card_type" TEXT DEFAULT 'value' CHECK (gift_card_type IN ('value', 'street_lamp', 'season1_artwork'));

-- Allow 'scheduled' status for future-delivery gift cards
ALTER TABLE "public"."gift_cards" DROP CONSTRAINT IF EXISTS "gift_cards_status_check";
ALTER TABLE "public"."gift_cards" ADD CONSTRAINT "gift_cards_status_check"
  CHECK (status IN ('issued', 'scheduled', 'redeemed', 'provisioning_failed'));

COMMENT ON COLUMN "public"."gift_cards"."gift_card_type" IS 'value: dollar amount; street_lamp: 1 Street Lamp; season1_artwork: 1 Season 1 artwork ($40).';
COMMENT ON COLUMN "public"."gift_cards"."send_at" IS 'When to send email; null = immediately.';
COMMENT ON COLUMN "public"."gift_cards"."design" IS 'Design ID chosen (e.g. classic, minimal, festive).';
