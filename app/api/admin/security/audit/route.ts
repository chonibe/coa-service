import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { guardAdminRequest } from "@/lib/auth-guards"

export async function GET(request: NextRequest) {
  // Guard the request
  const guardResult = guardAdminRequest(request)
  if (guardResult.kind !== "ok") {
    return guardResult.response || NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get("limit") || "100")
  const offset = parseInt(searchParams.get("offset") || "0")

  const supabase = createClient()

  try {
    const { data, error, count } = await supabase
      .from("sql_execution_audit")
      .select("*", { count: "exact" })
      .order("executed_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("[Audit API] Error fetching logs:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      logs: data,
      total: count,
      limit,
      offset
    })
  } catch (err) {
    console.error("[Audit API] Unexpected error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

