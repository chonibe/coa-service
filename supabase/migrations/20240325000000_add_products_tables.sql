-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create editions table
CREATE TABLE editions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_adjustment DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'active' NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create variants table
CREATE TABLE variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_adjustment DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'active' NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create line_items table
CREATE TABLE line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  edition_id UUID REFERENCES editions(id),
  variant_id UUID REFERENCES variants(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE editions ENABLE ROW LEVEL SECURITY;
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_items ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins can do everything"
  ON products FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can do everything"
  ON editions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can do everything"
  ON variants FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can do everything"
  ON line_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Public read policies
CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view editions"
  ON editions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view variants"
  ON variants FOR SELECT
  USING (true);

-- Order-related policies
CREATE POLICY "Users can view their own line items"
  ON line_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = line_items.order_id
    AND (orders.user_id = auth.uid() OR orders.vendor_id = auth.uid())
  ));

-- Create indexes
CREATE INDEX idx_editions_product_id ON editions(product_id);
CREATE INDEX idx_variants_product_id ON variants(product_id);
CREATE INDEX idx_line_items_order_id ON line_items(order_id);
CREATE INDEX idx_line_items_product_id ON line_items(product_id);
CREATE INDEX idx_line_items_edition_id ON line_items(edition_id);
CREATE INDEX idx_line_items_variant_id ON line_items(variant_id); 