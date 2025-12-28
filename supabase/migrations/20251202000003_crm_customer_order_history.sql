-- Migration to add customer order history tracking
-- Links CRM customers to their order history

-- Create junction table for customer orders
CREATE TABLE IF NOT EXISTS crm_customer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES crm_customers(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL, -- Can be Shopify order ID or ChinaDivision order ID
  order_source TEXT NOT NULL, -- 'shopify' or 'chinadivision'
  order_number TEXT,
  order_date TIMESTAMP WITH TIME ZONE,
  total_amount NUMERIC(10,2),
  currency_code TEXT DEFAULT 'USD',
  status TEXT,
  products JSONB, -- Array of products in the order
  metadata JSONB, -- Additional order data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, order_id, order_source)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_crm_customer_orders_customer_id ON crm_customer_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_customer_orders_order_id ON crm_customer_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_crm_customer_orders_order_date ON crm_customer_orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_crm_customer_orders_order_source ON crm_customer_orders(order_source);

