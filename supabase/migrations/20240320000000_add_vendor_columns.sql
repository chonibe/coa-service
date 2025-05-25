-- Add new columns to vendors table if they don't exist
DO $$ 
BEGIN
    -- Add instagram_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'vendors' AND column_name = 'instagram_url') THEN
        ALTER TABLE vendors ADD COLUMN instagram_url TEXT;
    END IF;

    -- Add product_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'vendors' AND column_name = 'product_count') THEN
        ALTER TABLE vendors ADD COLUMN product_count INTEGER DEFAULT 0;
    END IF;

    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'vendors' AND column_name = 'status') THEN
        ALTER TABLE vendors ADD COLUMN status TEXT DEFAULT 'active';
    END IF;

    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'vendors' AND column_name = 'created_at') THEN
        ALTER TABLE vendors ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'vendors' AND column_name = 'updated_at') THEN
        ALTER TABLE vendors ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Create index on vendor_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                  WHERE tablename = 'vendors' AND indexname = 'vendors_id_idx') THEN
        CREATE INDEX vendors_id_idx ON vendors(id);
    END IF;
END $$;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger 
                  WHERE tgname = 'update_vendors_updated_at') THEN
        CREATE TRIGGER update_vendors_updated_at
            BEFORE UPDATE ON vendors
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$; 