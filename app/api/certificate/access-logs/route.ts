import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createClient()
  
  try {
    const { searchParams } = new URL(request.url)
    const lineItemId = searchParams.get("lineItemId")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "50")

    // Calculate the range for pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Build the query
    let query = supabase.from("certificate_access_logs").select("*", { count: "exact" })

    // Apply line item filter if provided
    if (lineItemId) {
      query = query.eq("line_item_id", lineItemId)
    }

    // Apply sorting and pagination
    query = query.order("accessed_at", { ascending: false }).range(from, to)

    // Execute the query
    const { data, error, count } = await query

    if (error) {
      console.error("Error fetching certificate access logs:", error)
      return NextResponse.json({ success: false, message: "Failed to fetch certificate access logs" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      logs: data || [],
      pagination: {
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    })
  } catch (error: any) {
    console.error("Error in certificate access logs API:", error)
    return NextResponse.json({ success: false, message: error.message || "An error occurred" }, { status: 500 })
  }
}
