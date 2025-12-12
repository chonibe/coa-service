-- Add series metadata for hidden/VIP flows
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='artwork_series' AND column_name='is_private') THEN
        ALTER TABLE artwork_series ADD COLUMN is_private BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='artwork_series' AND column_name='teaser_image_url') THEN
        ALTER TABLE artwork_series ADD COLUMN teaser_image_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='artwork_series' AND column_name='unlock_message') THEN
        ALTER TABLE artwork_series ADD COLUMN unlock_message TEXT;
    END IF;
END
$$;

