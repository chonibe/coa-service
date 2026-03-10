import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import fs from "fs"
import path from "path"

export async function POST(request: NextRequest) {
  const guardResult = guardAdminRequest(request)
  if (guardResult.kind !== "ok") {
    return guardResult.response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const supabase = createClient()
  
  try {
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), "db", "tax_summary_function.sql")
    const sqlQuery = fs.readFileSync(sqlFilePath, "utf8")

    // Execute the SQL query
    const { error } = await supabase.rpc("exec_sql", { sql: sqlQuery })

    if (error) {
      console.error("Error initializing tax summary function:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Tax summary function initialized successfully" })
  } catch (error: any) {
    console.error("Error in tax reporting init functions API:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
