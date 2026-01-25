-- Migration: Add signature upload support to vendors table
-- Allows artists to upload their signature image for display on artwork pages

-- Add signature_url column to vendors table
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS signature_url TEXT,
ADD COLUMN IF NOT EXISTS signature_uploaded_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vendors_signature_url 
ON vendors(signature_url) 
WHERE signature_url IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN vendors.signature_url IS 'URL to the artist signature image, stored in Supabase storage bucket vendor-signatures';
COMMENT ON COLUMN vendors.signature_uploaded_at IS 'Timestamp when the signature was uploaded';
