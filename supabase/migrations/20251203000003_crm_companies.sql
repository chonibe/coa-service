-- Migration: Companies/Organizations
-- Support for company records and linking people to companies

-- ============================================
-- PART 1: Companies Table
-- ============================================

CREATE TABLE IF NOT EXISTS crm_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT, -- Company website domain
  website TEXT,
  industry TEXT,
  company_size TEXT, -- '1-10', '11-50', '51-200', '201-500', '500+'
  description TEXT,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  address JSONB, -- Full address as JSON
  tags TEXT[],
  metadata JSONB,
  -- Aggregated metrics
  total_people INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC(10,2) DEFAULT 0,
  first_order_date TIMESTAMP WITH TIME ZONE,
  last_order_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_companies_name ON crm_companies(name);
CREATE INDEX IF NOT EXISTS idx_crm_companies_domain ON crm_companies(domain);
CREATE INDEX IF NOT EXISTS idx_crm_companies_email ON crm_companies(email);

-- ============================================
-- PART 2: Link Customers to Companies
-- ============================================

-- Add company_id to customers table
ALTER TABLE crm_customers 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_crm_customers_company_id ON crm_customers(company_id);

-- ============================================
-- PART 3: Triggers
-- ============================================

CREATE TRIGGER update_crm_companies_updated_at
  BEFORE UPDATE ON crm_companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PART 4: Function to Update Company Metrics
-- ============================================

CREATE OR REPLACE FUNCTION update_company_metrics()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.company_id IS NOT NULL THEN
    UPDATE crm_companies
    SET 
      total_people = (
        SELECT COUNT(*) 
        FROM crm_customers 
        WHERE company_id = NEW.company_id
      ),
      total_orders = (
        SELECT COALESCE(SUM(total_orders), 0)
        FROM crm_customers
        WHERE company_id = NEW.company_id
      ),
      total_spent = (
        SELECT COALESCE(SUM(total_spent), 0)
        FROM crm_customers
        WHERE company_id = NEW.company_id
      ),
      first_order_date = (
        SELECT MIN(first_order_date)
        FROM crm_customers
        WHERE company_id = NEW.company_id AND first_order_date IS NOT NULL
      ),
      last_order_date = (
        SELECT MAX(last_order_date)
        FROM crm_customers
        WHERE company_id = NEW.company_id AND last_order_date IS NOT NULL
      ),
      updated_at = NOW()
    WHERE id = NEW.company_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update company metrics when customer is updated
CREATE TRIGGER update_company_metrics_on_customer_update
  AFTER INSERT OR UPDATE ON crm_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_company_metrics();

