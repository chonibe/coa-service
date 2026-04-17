-- vendor_payouts: carry cancel / rejection / failure / processed metadata
--
-- The AppShell payouts page needs to explain to the artist why a payout
-- landed in a non-happy state, show when it was processed, and let them
-- cancel a `requested` payout before the admin approves it.
--
-- We add the columns if-not-exists so the migration is safe to re-run and
-- plays well with any prior ad-hoc alters.

ALTER TABLE vendor_payouts
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS failure_reason   TEXT,
  ADD COLUMN IF NOT EXISTS processed_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS canceled_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS canceled_by      TEXT,
  ADD COLUMN IF NOT EXISTS cancel_reason    TEXT;

-- Allow the `canceled` status going forward. vendor_payouts.status is TEXT
-- today (no CHECK constraint), so no enum alter needed — this is documentary.
COMMENT ON COLUMN vendor_payouts.status IS
  'Lifecycle: requested → processing → (completed | rejected | failed | canceled). pending is legacy.';

-- Helpful partial index for the vendor cancel-lookup ("show me my requested payout").
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_vendor_status_requested
  ON vendor_payouts(vendor_name)
  WHERE status = 'requested';

-- Partial index for admin dashboards that triage rejected/failed payouts.
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_status_needs_attention
  ON vendor_payouts(status, updated_at DESC)
  WHERE status IN ('rejected', 'failed');
