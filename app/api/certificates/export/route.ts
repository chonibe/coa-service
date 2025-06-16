import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const sortField = searchParams.get("sortField") || "created_at"
    const sortDirection = searchParams.get("sortDirection") || "desc"

    // Build the query
    let query = supabaseAdmin.from("order_line_items_v2").select("*")

    // Apply filters
    if (productId) {
      query = query.eq("product_id", productId)
    }

    if (status) {
      query = query.eq("status", status)
    }

    // Apply search term if provided
    if (search) {
      query = query.or(`line_item_id.ilike.%${search}%,order_id.ilike.%${search}%,order_name.ilike.%${search}%`)
    }

    // Apply sorting
    query = query.order(sortField, { ascending: sortDirection === "asc" })

    // Execute the query
    const { data, error } = await query

    if (error) {
      console.error("Error exporting certificates:", error)
      return NextResponse.json({ success: false, message: "Failed to export certificates" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      certificates: data || [],
    })
  } catch (error: any) {
    console.error("Error in certificates export API:", error)
    return NextResponse.json({ success: false, message: error.message || "An error occurred" }, { status: 500 })
  }
}
