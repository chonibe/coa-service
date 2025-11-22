import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/admin/payouts/email-logs/export
 * Export email logs as CSV
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
    let query = supabase.from("email_log").select("*").order("sent_at", { ascending: false })

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
      return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
    }

    // Generate CSV
    const headers = [
      "ID",
      "Recipient Email",
      "Recipient Name",
      "Subject",
      "Type",
      "Status",
      "Sent At",
      "Delivered At",
      "Opened At",
      "Error Message",
    ]

    const rows = (logs || []).map((log) => [
      log.id,
      log.recipient_email,
      log.recipient_name || "",
      log.subject,
      log.email_type,
      log.status,
      log.sent_at,
      log.delivered_at || "",
      log.opened_at || "",
      log.error_message || "",
    ])

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="email-logs-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 })
  }
}

