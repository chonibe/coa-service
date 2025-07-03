import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseUrl, getSupabaseKey } from '@/lib/supabase/client-utils'
import fs from "fs"
import path from "path"

export async function POST() {
  try {
    const supabase = createClient(
      getSupabaseUrl(),
      getSupabaseKey('service')
    )

    // Read the SQL file
    const sqlContent = fs.readFileSync(path.join(process.cwd(), "db", "collector_benefits_tables.sql"), "utf8")

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql_query: sqlContent })

    if (error) {
      console.error("Error creating benefit tables:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Benefit tables created successfully" })
  } catch (error: any) {
    console.error("Error in init-tables:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
