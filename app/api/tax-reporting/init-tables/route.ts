import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import fs from "fs"
import path from "path"

export async function POST() {
  const supabase = createClient()
  
  try {
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), "db", "tax_reporting_updates.sql")
    const sqlQuery = fs.readFileSync(sqlFilePath, "utf8")

    // Execute the SQL query
    const { error } = await supabase.rpc("exec_sql", { sql: sqlQuery })

    if (error) {
      console.error("Error initializing tax reporting tables:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update existing payouts with tax year
    const { error: updateError } = await supabase.rpc("exec_sql", {
      sql: "UPDATE vendor_payouts SET tax_year = EXTRACT(YEAR FROM payout_date)::INTEGER WHERE payout_date IS NOT NULL AND tax_year IS NULL",
    })

    if (updateError) {
      console.error("Error updating existing payouts with tax year:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Tax reporting tables initialized successfully" })
  } catch (error: any) {
    console.error("Error in tax reporting init tables API:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
