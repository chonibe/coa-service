import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  const supabase = createClient()
  
  try {
    // Read the SQL file content
    const sqlQuery = `
    -- Update vendor_payouts table with additional fields for tax compliance and payment processing
    CREATE TABLE IF NOT EXISTS vendor_payouts (
        id SERIAL PRIMARY KEY,
        vendor_name TEXT NOT NULL REFERENCES vendors(vendor_name),
        amount DECIMAL(10, 2) NOT NULL,
        currency TEXT DEFAULT 'GBP',
        status TEXT NOT NULL DEFAULT 'pending',
        payout_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        reference TEXT,
        product_count INTEGER DEFAULT 0,
        payment_method TEXT DEFAULT 'paypal',
        payment_id TEXT,
        invoice_number TEXT,
        tax_rate DECIMAL(5, 2) DEFAULT 0,
        tax_amount DECIMAL(10, 2) DEFAULT 0,
        notes TEXT,
        processed_by TEXT,
        is_self_billed BOOLEAN DEFAULT TRUE,
        payment_details JSONB
    );
    
    -- Create index on vendor_name for faster lookups
    CREATE INDEX IF NOT EXISTS vendor_payouts_vendor_name_idx ON vendor_payouts (vendor_name);
    
    -- Create index on status for filtering
    CREATE INDEX IF NOT EXISTS vendor_payouts_status_idx ON vendor_payouts (status);
    
    -- Add tax_id field to vendors table if it doesn't exist
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'vendors' AND column_name = 'tax_id'
        ) THEN
            ALTER TABLE vendors ADD COLUMN tax_id TEXT;
        END IF;
    END $$;
    
    -- Add tax_country field to vendors table if it doesn't exist
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'vendors' AND column_name = 'tax_country'
        ) THEN
            ALTER TABLE vendors ADD COLUMN tax_country TEXT;
        END IF;
    END $$;
    
    -- Add is_company field to vendors table if it doesn't exist
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'vendors' AND column_name = 'is_company'
        ) THEN
            ALTER TABLE vendors ADD COLUMN is_company BOOLEAN DEFAULT FALSE;
        END IF;
    END $$;
    `

    // Execute the SQL query
    const { error } = await supabase.rpc("exec_sql", { sql_query: sqlQuery })

    if (error) {
      console.error("Error initializing payout tables:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Payout tables initialized successfully" })
  } catch (error: any) {
    console.error("Error in init-payout-tables API:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
