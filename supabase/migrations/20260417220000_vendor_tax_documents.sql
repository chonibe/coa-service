-- Vendor-uploaded tax documents (Phase 4 MVP)
--
-- Artists need a surface to submit W-9 / W-8BEN PDFs and later download
-- admin-issued 1099s. We deliberately keep this table VENDOR-SCOPED and
-- separate from the admin-managed `vendor_tax_forms` table so the trust
-- boundary stays clean: artists only write here; admins only read. The
-- admin side can mirror/promote approved uploads to `vendor_tax_forms`
-- when it ingests them.
--
-- Idempotent. Safe to re-run.

-- NB: `vendors.id` is an INTEGER on this project (legacy from the
-- original Shopify sync schema). We keep the PK of this table as UUID
-- for tamper-resistant ids in URLs, but FK must match the int vendors.id.
CREATE TABLE IF NOT EXISTS vendor_tax_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('w9', 'w8ben', 'other')),
  tax_year INTEGER,
  storage_bucket TEXT NOT NULL DEFAULT 'vendor-tax-documents',
  storage_path TEXT NOT NULL,
  file_name TEXT,
  mime_type TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'accepted', 'rejected')),
  admin_notes TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE vendor_tax_documents IS 'Vendor-uploaded tax documents (W-9, W-8BEN, etc.). Admin moderates via the status column.';
COMMENT ON COLUMN vendor_tax_documents.storage_path IS 'Path inside storage_bucket. e.g. {vendor_slug}/2026/w9-original.pdf';

CREATE INDEX IF NOT EXISTS idx_vendor_tax_documents_vendor
  ON vendor_tax_documents(vendor_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_tax_documents_status
  ON vendor_tax_documents(status)
  WHERE status != 'accepted';

-- RLS: vendors can read/write their own rows; admins (no vendor_id) go
-- through the service-role client. We mirror the pattern used on
-- vendor_product_submissions.
ALTER TABLE vendor_tax_documents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'vendor_tax_documents'
      AND policyname = 'vendor_tax_documents_service_role'
  ) THEN
    CREATE POLICY vendor_tax_documents_service_role
      ON vendor_tax_documents
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
