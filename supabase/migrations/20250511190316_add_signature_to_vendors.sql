-- Add signature_url column to vendors table
ALTER TABLE "public"."vendors"
ADD COLUMN IF NOT EXISTS "signature_url" TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vendors_signature_url ON "public"."vendors" ("signature_url"); 