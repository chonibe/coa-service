import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Supabase client not initialized")
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "20")
    const productId = searchParams.get("productId")
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const sortField = searchParams.get("sortField") || "created_at"
    const sortDirection = searchParams.get("sortDirection") || "desc"

    // Calculate the range for pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Build the query with specific columns to reduce data transfer
    let query = supabase
      .from("order_line_items_v2")
      .select(
        "line_item_id, order_id, order_name, product_id, edition_number, edition_total, status, certificate_url, certificate_generated_at, created_at",
        { count: "exact" }
      )

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

    // Apply pagination
    query = query.range(from, to)

    // Set a timeout for the query
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Query timeout")), 10000) // 10 second timeout
    })

    // Execute the query with timeout
    const result = await Promise.race([query, timeoutPromise]) as {
      data: any[] | null
      error: any
      count: number | null
    }

    if (result.error) {
      console.error("Error fetching certificates:", result.error)
      return NextResponse.json(
        { success: false, message: "Failed to fetch certificates" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      certificates: result.data || [],
      totalCount: result.count || 0,
    })
  } catch (error: any) {
    console.error("Error in certificates list API:", error)
    if (error.message === "Query timeout") {
      return NextResponse.json(
        { success: false, message: "Request timed out. Please try again with fewer items or more specific filters." },
        { status: 504 }
      )
    }
    return NextResponse.json(
      { success: false, message: error.message || "An error occurred" },
      { status: 500 }
    )
  }
}
