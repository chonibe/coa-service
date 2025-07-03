import { getSupabaseUrl, getSupabaseKey } from '@/lib/supabase/client-utils'
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import fs from "fs"
import path from "path"

export async function POST() {
  try {
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), "db", "vendor_payout_functions.sql")
    const sqlContent = fs.readFileSync(sqlFilePath, "utf8")

    // Create Supabase client
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // First, make sure the vendor_payout_items table exists
    const { error: tableError } = await supabase.rpc("exec_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS vendor_payout_items (
          id SERIAL PRIMARY KEY,
          payout_id INTEGER,
          line_item_id TEXT NOT NULL,
          order_id TEXT NOT NULL,
          product_id TEXT NOT NULL,
          amount DECIMAL NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(payout_id, line_item_id)
        );
        
        CREATE INDEX IF NOT EXISTS vendor_payout_items_line_item_idx ON vendor_payout_items(line_item_id);
        CREATE INDEX IF NOT EXISTS vendor_payout_items_payout_id_idx ON vendor_payout_items(payout_id);
      `
    })

    if (tableError) {
      console.error("Error creating vendor_payout_items table:", tableError)
      return NextResponse.json({ error: tableError.message }, { status: 500 })
    }

    // Execute the SQL functions
    const { error } = await supabase.rpc("exec_sql", { sql_query: sqlContent })

    if (error) {
      console.error("Error initializing payout functions:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Payout functions initialized successfully" })
  } catch (error: any) {
    console.error("Error in init payout functions API:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
