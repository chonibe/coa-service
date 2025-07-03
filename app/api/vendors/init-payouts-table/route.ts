import { NextResponse } from "next/server"
import { supabaseAdmin } from "/dev/null"

export async function POST() {
  try {
    // Read the SQL file
    const sqlQuery = `
    -- Create vendor_payouts table to track payout settings for products
    CREATE TABLE IF NOT EXISTS vendor_payouts (
      id SERIAL PRIMARY KEY,
      product_id TEXT NOT NULL,
      vendor_name TEXT NOT NULL,
      payout_amount DECIMAL(10, 2),
      is_percentage BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create index on product_id for faster lookups
    CREATE INDEX IF NOT EXISTS vendor_payouts_product_id_idx ON vendor_payouts (product_id);
    
    -- Create index on vendor_name for faster lookups
    CREATE INDEX IF NOT EXISTS vendor_payouts_vendor_name_idx ON vendor_payouts (vendor_name);
    
    -- Add PayPal email field to vendors table
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS paypal_email TEXT;
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
    `

    // Execute the SQL query
    const { error } = await supabaseAdmin.rpc("exec_sql", { sql_query: sqlQuery })

    if (error) {
      console.error("Error initializing vendor payouts table:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Vendor payouts table initialized successfully" })
  } catch (error) {
    console.error("Error in init-payouts-table API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
