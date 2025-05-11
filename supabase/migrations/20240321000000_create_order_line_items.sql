-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    shopify_line_item_id BIGINT NOT NULL,
    product_id UUID REFERENCES products(id),
    variant_id BIGINT,
    title TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    sku TEXT,
    vendor TEXT,
    properties JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(order_id, shopify_line_item_id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_shopify_line_item_id ON order_items(shopify_line_item_id);

-- Add RLS policies
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON order_items
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for service role" ON order_items
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "Enable update for service role" ON order_items
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true); 