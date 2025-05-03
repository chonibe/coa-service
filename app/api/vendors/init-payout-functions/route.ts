import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import fs from "fs"
import path from "path"

export async function POST() {
  try {
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), "db", "vendor_payout_functions.sql")
    const sqlContent = fs.readFileSync(sqlFilePath, "utf8")

    // Execute the SQL
    const { error } = await supabaseAdmin.rpc("exec_sql", { sql: sqlContent })

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
