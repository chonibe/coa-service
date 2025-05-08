-- Create sync_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS sync_logs (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  details JSONB,
  type VARCHAR(255) DEFAULT 'shopify_orders'
);

-- Create sync_status table if it doesn't exist
CREATE TABLE IF NOT EXISTS sync_status (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  details JSONB,
  type VARCHAR(255) DEFAULT 'shopify_orders'
);

-- Create webhook_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS webhook_logs (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  details JSONB,
  type VARCHAR(255) DEFAULT 'shopify_order'
);

-- Create order_line_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS order_line_items (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(255) NOT NULL,
  order_name VARCHAR(255),
  line_item_id VARCHAR(255) NOT NULL,
  product_id VARCHAR(255) NOT NULL,
  variant_id VARCHAR(255),
  edition_number INTEGER,
  edition_total INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'active',
  removed_reason TEXT,
  UNIQUE(order_id, line_item_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_line_items_order_id ON order_line_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_line_items_product_id ON order_line_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_line_items_status ON order_line_items(status);
CREATE INDEX IF NOT EXISTS idx_order_line_items_created_at ON order_line_items(created_at);
