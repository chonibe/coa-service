-- Artist-controlled "closed" listing + draft submissions

DO $$ BEGIN
  ALTER TYPE product_submission_status ADD VALUE 'draft';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE product_submission_status ADD VALUE 'closed';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE product_submission_status IS 'Vendor submission lifecycle. closed = artist ended listing (e.g. after sales); draft = in-progress artwork.';
