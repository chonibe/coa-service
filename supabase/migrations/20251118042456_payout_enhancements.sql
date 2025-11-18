-- Add manual payout tracking fields to vendor_payout_items table
-- This allows tracking of manually marked payouts with audit trail

-- Check if vendor_payout_items table exists, if not create it
CREATE TABLE IF NOT EXISTS vendor_payout_items (
    id SERIAL PRIMARY KEY,
    payout_id INTEGER,
    line_item_id TEXT NOT NULL,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(payout_id, line_item_id)
);

-- Add manual payout tracking columns if they don't exist
DO $$
BEGIN
    -- Add manually_marked_paid column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vendor_payout_items' AND column_name = 'manually_marked_paid'
    ) THEN
        ALTER TABLE vendor_payout_items ADD COLUMN manually_marked_paid BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add marked_by column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vendor_payout_items' AND column_name = 'marked_by'
    ) THEN
        ALTER TABLE vendor_payout_items ADD COLUMN marked_by TEXT;
    END IF;

    -- Add marked_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vendor_payout_items' AND column_name = 'marked_at'
    ) THEN
        ALTER TABLE vendor_payout_items ADD COLUMN marked_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add payout_reference column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vendor_payout_items' AND column_name = 'payout_reference'
    ) THEN
        ALTER TABLE vendor_payout_items ADD COLUMN payout_reference TEXT;
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS vendor_payout_items_line_item_idx ON vendor_payout_items(line_item_id);
CREATE INDEX IF NOT EXISTS vendor_payout_items_payout_id_idx ON vendor_payout_items(payout_id);
CREATE INDEX IF NOT EXISTS vendor_payout_items_order_id_idx ON vendor_payout_items(order_id);
CREATE INDEX IF NOT EXISTS vendor_payout_items_manually_marked_idx ON vendor_payout_items(manually_marked_paid) WHERE manually_marked_paid = TRUE;

-- Add comment to table
COMMENT ON TABLE vendor_payout_items IS 'Tracks individual line items included in vendor payouts, with support for manual payout marking and audit trail';

