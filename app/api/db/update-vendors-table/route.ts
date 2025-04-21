import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import fs from "fs"
import path from "path"

export async function POST() {
  try {
    // Read the SQL file
    const sql = fs.readFileSync(path.join(process.cwd(), "db", "vendors_table_update.sql"), "utf8")

    // Execute the SQL directly
    const { error } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (error) {
      console.error("Error updating vendors table:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Vendors table updated successfully" })
  } catch (error) {
    console.error("Unexpected error updating vendors table:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
