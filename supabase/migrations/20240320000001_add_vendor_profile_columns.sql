-- Add new columns to vendors table if they don't exist
DO $$ 
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'vendors' AND column_name = 'status') THEN
        ALTER TABLE vendors ADD COLUMN status TEXT DEFAULT 'active';
    END IF;

    -- Add product_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'vendors' AND column_name = 'product_count') THEN
        ALTER TABLE vendors ADD COLUMN product_count INTEGER DEFAULT 0;
    END IF;

    -- Add contact_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'vendors' AND column_name = 'contact_name') THEN
        ALTER TABLE vendors ADD COLUMN contact_name TEXT;
    END IF;

    -- Add contact_email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'vendors' AND column_name = 'contact_email') THEN
        ALTER TABLE vendors ADD COLUMN contact_email TEXT;
    END IF;

    -- Add phone column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'vendors' AND column_name = 'phone') THEN
        ALTER TABLE vendors ADD COLUMN phone TEXT;
    END IF;

    -- Add address column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'vendors' AND column_name = 'address') THEN
        ALTER TABLE vendors ADD COLUMN address TEXT;
    END IF;

    -- Add website column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'vendors' AND column_name = 'website') THEN
        ALTER TABLE vendors ADD COLUMN website TEXT;
    END IF;

    -- Add bio column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'vendors' AND column_name = 'bio') THEN
        ALTER TABLE vendors ADD COLUMN bio TEXT;
    END IF;
END $$;

-- Create indexes for better performance
DO $$ 
BEGIN
    -- Create index on status if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                  WHERE tablename = 'vendors' AND indexname = 'vendors_status_idx') THEN
        CREATE INDEX vendors_status_idx ON vendors(status);
    END IF;

    -- Create index on product_count if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                  WHERE tablename = 'vendors' AND indexname = 'vendors_product_count_idx') THEN
        CREATE INDEX vendors_product_count_idx ON vendors(product_count);
    END IF;
END $$; 