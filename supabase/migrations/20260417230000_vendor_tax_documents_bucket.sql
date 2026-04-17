-- Create the private `vendor-tax-documents` storage bucket used by
-- /api/vendor/tax-documents for W-9 / W-8BEN / 1099 PDFs. Bucket is
-- PRIVATE (public = false) — access goes through 5-minute signed URLs
-- minted by the API. Idempotent.
--
-- RLS on storage.objects: we rely on the service-role key used by the
-- vendor API for writes, so we do NOT add user-scoped policies. Any
-- future migration adding RLS should pair read policies with an explicit
-- vendor_id check matching the storage path prefix.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendor-tax-documents',
  'vendor-tax-documents',
  false,
  10 * 1024 * 1024, -- 10MB cap, matches API validation
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;
