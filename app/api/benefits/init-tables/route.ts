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

  try {
    const supabase = createClient()
    const sqlContent = fs.readFileSync(path.join(process.cwd(), "db", "collector_benefits_tables.sql"), "utf8")

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
