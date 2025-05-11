-- Create order_line_items table
CREATE TABLE IF NOT EXISTS order_line_items (
    id BIGSERIAL PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    order_name TEXT,
    line_item_id TEXT NOT NULL,
    product_id TEXT,
    variant_id TEXT,
    title TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    sku TEXT,
    vendor_name TEXT,
    status TEXT DEFAULT 'active',
    fulfillment_status TEXT,
    total_discount DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(order_id, line_item_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_order_line_items_order_id ON order_line_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_line_items_product_id ON order_line_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_line_items_vendor_name ON order_line_items(vendor_name);

-- Add RLS policies
ALTER TABLE order_line_items ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access to authenticated users" ON order_line_items
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow insert/update/delete only to service role
CREATE POLICY "Allow all access to service role" ON order_line_items
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true); 