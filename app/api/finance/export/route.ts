import { NextRequest, NextResponse } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/finance/export
 * Exports ledger entries in CSV or JSON format for accounting/auditing.
 * Query Params:
 * - vendorName: (Optional) Filter by vendor
 * - format: 'csv' | 'json' (default: 'json')
 * - startDate: (Optional)
 * - endDate: (Optional)
 */
export async function GET(request: NextRequest) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  try {
    const { searchParams } = request.nextUrl
    const vendorName = searchParams.get("vendorName")
    const format = searchParams.get("format") || "json"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const supabase = createClient()
    
    let query = supabase
      .from("collector_ledger_entries")
      .select("*")
      .order("created_at", { ascending: true })

    if (vendorName) {
      // Get auth_id for vendor
      const { data: vendor } = await supabase
        .from("vendors")
        .select("auth_id, vendor_name")
        .eq("vendor_name", vendorName)
        .single()
      
      if (vendor) {
        query = query.eq("collector_identifier", vendor.auth_id || vendorName)
      }
    }

    if (startDate) {
      query = query.gte("created_at", startDate)
    }
    if (endDate) {
      query = query.lte("created_at", endDate)
    }

    const { data: entries, error } = await query

    if (error) throw error

    if (format === "csv") {
      const headers = ["id", "date", "type", "amount", "currency", "order_id", "line_item_id", "payout_id", "description", "tax_year", "created_by"]
      const rows = entries.map(e => [
        e.id,
        e.created_at,
        e.transaction_type,
        e.amount,
        e.currency,
        e.order_id || "",
        e.line_item_id || "",
        e.payout_id || "",
        `"${(e.description || "").replace(/"/g, '""')}"`,
        e.tax_year || "",
        e.created_by
      ])

      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
      
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="finance_export_${Date.now()}.csv"`
        }
      })
    }

    return NextResponse.json({ entries })

  } catch (error: any) {
    console.error("Error in finance export:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


