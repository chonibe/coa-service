-- Series archive support — adds an explicit timestamp the artist UI can
-- read so we can distinguish "I deactivated this for a moment" from "I
-- archived this collection". Existing soft-delete continues to flow
-- through `is_active = false`; the new column piggybacks for ordering
-- and disclosure ("archived 3 weeks ago"). Idempotent.
ALTER TABLE artwork_series
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN artwork_series.archived_at IS
  'Set when the artist archives a series. NULL when active. Kept alongside is_active so the artist UI can show "archived 3w ago" and offer an Unarchive action without losing the moderation history.';

CREATE INDEX IF NOT EXISTS idx_artwork_series_archived_at
  ON artwork_series(vendor_id, archived_at DESC)
  WHERE archived_at IS NOT NULL;
