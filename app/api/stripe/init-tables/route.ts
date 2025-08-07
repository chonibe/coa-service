import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import fs from "fs"
import path from "path"

export async function POST() {
  const supabase = createClient()
  
  try {
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), "db", "add_stripe_fields.sql")
    const sqlQuery = fs.readFileSync(sqlFilePath, "utf8")

    // Execute the SQL query
    const { error } = await supabase.rpc("exec_sql", { sql: sqlQuery })

    if (error) {
      console.error("Error initializing Stripe tables:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Stripe fields added to database" })
  } catch (error: any) {
    console.error("Error in Stripe init tables API:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
