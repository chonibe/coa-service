import { getSupabaseUrl, getSupabaseKey } from '@/lib/supabase/client-utils'
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import fs from "fs"
import path from "path"

export async function POST() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), "db", "vendor_onboarding_fields.sql")
    const sqlQuery = fs.readFileSync(sqlFilePath, "utf8")

    // Execute the SQL query
    const { error } = await supabase.rpc("exec_sql", { sql_query: sqlQuery })

    if (error) {
      console.error("Error initializing vendor onboarding fields:", error)
      return NextResponse.json({ error: "Failed to initialize vendor onboarding fields" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Vendor onboarding fields initialized successfully" })
  } catch (error) {
    console.error("Error initializing vendor onboarding fields:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
