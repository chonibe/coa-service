import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const status = searchParams.get("status") || "all"
    const search = searchParams.get("search") || ""
    const pageSize = 20

    let query = supabase
      .from("order_line_items")
      .select(`
        *,
        product:products (
          title,
          vendor,
          certificate_url
        )
      `)
      .order("updated_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    // Apply status filter
    if (status !== "all") {
      query = query.eq("status", status)
    }

    // Apply search filter
    if (search) {
      query = query.or(
        `order_name.ilike.%${search}%,order_id.ilike.%${search}%,product_id.ilike.%${search}%`
      )
    }

    const { data: orders, error, count } = await query

    if (error) {
      throw error
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from("order_line_items")
      .select("*", { count: "exact", head: true })

    return NextResponse.json({
      orders,
      hasMore: totalCount ? page * pageSize < totalCount : false,
      total: totalCount,
    })
  } catch (error: any) {
    console.error("Error fetching orders:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch orders" },
      { status: 500 }
    )
  }
} 