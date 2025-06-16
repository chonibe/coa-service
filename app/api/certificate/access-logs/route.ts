import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { formatDate } from "@/lib/utils"

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client using the server-side method
    const supabase = createClient()

    const searchParams = request.nextUrl.searchParams
    const lineItemId = searchParams.get("line_item_id")
    const orderId = searchParams.get("order_id")
    const productId = searchParams.get("product_id")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")
    const page = parseInt(searchParams.get("page") || "1", 10)
    const pageSize = parseInt(searchParams.get("pageSize") || "50", 10)

    // Calculate offset for pagination
    const offset = (page - 1) * pageSize

    // Build the base query
    let query = supabase
      .from("certificate_access_logs")
      .select(`
        *,
        order_line_items_v2 (
          line_item_id,
          product_id,
          title,
          edition_number,
          edition_total
        ),
        orders (name),
        products (title, vendor_name, collection_name)
      `, { count: "exact" })

    // Apply filters
    if (lineItemId) {
      query = query.eq("line_item_id", lineItemId)
    }

    if (orderId) {
      query = query.eq("order_id", orderId)
    }

    if (productId) {
      query = query.eq("product_id", productId)
    }

    // Date range filter
    if (startDate) {
      query = query.gte("accessed_at", startDate)
    }

    if (endDate) {
      query = query.lte("accessed_at", endDate)
    }

    // Apply pagination and sorting
    query = query
      .order("accessed_at", { ascending: false })
      .range(offset, offset + pageSize - 1)

    // Execute the query
    const { data: logs, count, error } = await query

    if (error) {
      console.error("Error fetching certificate access logs:", error)
      return NextResponse.json({ error: "Failed to fetch certificate access logs" }, { status: 500 })
    }

    // Transform logs to include more details
    const transformedLogs = (logs || []).map(log => ({
      id: log.id,
      lineItemId: log.line_item_id,
      orderId: log.order_id,
      productId: log.product_id,
      accessedAt: formatDate(log.accessed_at),
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      lineItem: log.order_line_items_v2 ? {
        title: log.order_line_items_v2.title,
        editionNumber: log.order_line_items_v2.edition_number,
        editionTotal: log.order_line_items_v2.edition_total,
      } : null,
      order: log.orders ? {
        name: log.orders.name,
      } : null,
      product: log.products ? {
        title: log.products.title,
        vendorName: log.products.vendor_name,
        collectionName: log.products.collection_name,
      } : null,
    }))

    return NextResponse.json({
      logs: transformedLogs,
      pagination: {
        page,
        pageSize,
        totalCount: count || 0,
        totalPages: count ? Math.ceil(count / pageSize) : 0,
      }
    })
  } catch (error: any) {
    console.error("Unexpected error in certificate access logs:", error)
    return NextResponse.json({ 
      error: error.message || "An unexpected error occurred" 
    }, { status: 500 })
  }
}
