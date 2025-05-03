-- Add tax reporting fields to vendor_payouts table if they don't exist
DO $$
BEGIN
    -- Add tax_year field for easier querying by tax year
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vendor_payouts' AND column_name = 'tax_year'
    ) THEN
        ALTER TABLE vendor_payouts ADD COLUMN tax_year INTEGER;
        -- Update existing records with tax year based on payout_date
        UPDATE vendor_payouts SET tax_year = EXTRACT(YEAR FROM payout_date) WHERE payout_date IS NOT NULL;
    END IF;

    -- Add tax_form_generated field to track if tax forms have been generated
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vendor_payouts' AND column_name = 'tax_form_generated'
    ) THEN
        ALTER TABLE vendor_payouts ADD COLUMN tax_form_generated BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add tax_form_number field to store reference numbers for generated tax forms
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vendor_payouts' AND column_name = 'tax_form_number'
    ) THEN
        ALTER TABLE vendor_payouts ADD COLUMN tax_form_number TEXT;
    END IF;
END $$;

-- Create tax_forms table to store generated tax forms
CREATE TABLE IF NOT EXISTS tax_forms (
    id SERIAL PRIMARY KEY,
    vendor_name TEXT NOT NULL REFERENCES vendors(vendor_name),
    tax_year INTEGER NOT NULL,
    form_type TEXT NOT NULL, -- e.g., '1099-MISC', 'P60', etc.
    form_number TEXT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    generated_by TEXT,
    form_data JSONB, -- Stores all data used to generate the form
    pdf_url TEXT,
    status TEXT DEFAULT 'pending',
    sent_to_vendor BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(vendor_name, tax_year, form_type)
);

-- Create index on tax_year for faster lookups
CREATE INDEX IF NOT EXISTS tax_forms_tax_year_idx ON tax_forms (tax_year);

-- Create index on vendor_name for faster lookups
CREATE INDEX IF NOT EXISTS tax_forms_vendor_name_idx ON tax_forms (vendor_name);
