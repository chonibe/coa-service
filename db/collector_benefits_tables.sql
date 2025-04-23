-- Create table for benefit types
CREATE TABLE IF NOT EXISTS benefit_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for product benefits
CREATE TABLE IF NOT EXISTS product_benefits (
    id SERIAL PRIMARY KEY,
    product_id TEXT NOT NULL,
    vendor_name TEXT NOT NULL,
    benefit_type_id INTEGER REFERENCES benefit_types(id),
    title TEXT NOT NULL,
    description TEXT,
    content_url TEXT,
    access_code TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    starts_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for collector benefit claims
CREATE TABLE IF NOT EXISTS collector_benefit_claims (
    id SERIAL PRIMARY KEY,
    product_benefit_id INTEGER REFERENCES product_benefits(id),
    line_item_id TEXT NOT NULL,
    customer_email TEXT,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    claim_code TEXT,
    status TEXT DEFAULT 'active'
);

-- Insert default benefit types if they don't exist
INSERT INTO benefit_types (name, description, icon)
VALUES 
    ('Digital Content', 'Digital files such as PDFs, videos, or images', 'file-text'),
    ('Exclusive Access', 'Early or exclusive access to content or products', 'key'),
    ('Virtual Event', 'Online events like livestreams or webinars', 'video'),
    ('Physical Item', 'Physical items like signed prints or merchandise', 'package'),
    ('Discount', 'Special discounts on future purchases', 'percent'),
    ('Behind the Scenes', 'Behind-the-scenes content and updates', 'eye')
ON CONFLICT (name) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS product_benefits_product_id_idx ON product_benefits (product_id);
CREATE INDEX IF NOT EXISTS product_benefits_vendor_name_idx ON product_benefits (vendor_name);
CREATE INDEX IF NOT EXISTS collector_benefit_claims_line_item_id_idx ON collector_benefit_claims (line_item_id);
