-- Add vendor_name column to order_line_items table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'order_line_items' 
        AND column_name = 'vendor_name'
    ) THEN
        ALTER TABLE order_line_items ADD COLUMN vendor_name TEXT;
        
        -- Create an index on vendor_name for faster lookups
        CREATE INDEX IF NOT EXISTS order_line_items_vendor_name_idx ON order_line_items (vendor_name);
        
        -- Add a comment explaining the purpose of this column
        COMMENT ON COLUMN order_line_items.vendor_name IS 'The name of the vendor associated with this line item';
    END IF;
END
$$;
