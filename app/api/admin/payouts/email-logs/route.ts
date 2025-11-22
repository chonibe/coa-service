import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/admin/payouts/email-logs
 * Get email logs with filters
 */
export async function GET(request: NextRequest) {
  try {
    await guardAdminRequest()

    const searchParams = request.nextUrl.searchParams
    const vendor = searchParams.get("vendor")
    const type = searchParams.get("type")
    const status = searchParams.get("status")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    const supabase = createClient()
    let query = supabase.from("email_log").select("*").order("sent_at", { ascending: false }).limit(500)

    if (vendor) {
      query = query.ilike("recipient_name", `%${vendor}%`)
    }

    if (type) {
      query = query.eq("email_type", type)
    }

    if (status) {
      query = query.eq("status", status)
    }

    if (dateFrom) {
      query = query.gte("sent_at", dateFrom)
    }

    if (dateTo) {
      query = query.lte("sent_at", dateTo)
    }

    const { data: logs, error } = await query

    if (error) {
      console.error("Error fetching email logs:", error)
      return NextResponse.json(
        { error: "Failed to fetch email logs", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ logs: logs || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 })
  }
}

