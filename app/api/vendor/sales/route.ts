import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorName = searchParams.get("vendor")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "10")

    if (!vendorName) {
      return NextResponse.json({ error: "Vendor name is required" }, { status: 400 })
    }

    // Calculate pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Get sales for this vendor with pagination
    const {
      data: sales,
      error: salesError,
      count,
    } = await supabaseAdmin
      .from("order_line_items")
      .select("*, order_line_items_meta!inner(*)", { count: "exact" })
      .eq("vendor_name", vendorName)
      .eq("status", "active")
      // Only count line items that are Unfulfilled or Fulfilled
      .in("fulfillment_status", ["Unfulfilled", "Fulfilled"])
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(from, to)

    if (salesError) {
      console.error("Error fetching vendor sales:", salesError)
      return NextResponse.json({ error: "Failed to fetch vendor sales" }, { status: 500 })
    }

    return NextResponse.json({
      sales: sales || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: count ? Math.ceil(count / pageSize) : 0,
      },
    })
  } catch (error) {
    console.error("Error in vendor sales API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
