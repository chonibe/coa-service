import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query") || ""
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10)
    const offset = Number.parseInt(searchParams.get("offset") || "0", 10)
    const sortBy = searchParams.get("sortBy") || "name"
    const sortOrder = searchParams.get("sortOrder") || "asc"

    // Build the query
    let queryBuilder = supabase.from("vendors").select("*", { count: "exact" })

    // Add search filter if provided
    if (query) {
      queryBuilder = queryBuilder.ilike("name", `%${query}%`)
    }

    // Add sorting
    queryBuilder = queryBuilder.order(sortBy, { ascending: sortOrder === "asc" })

    // Add pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1)

    // Execute the query
    const { data: vendors, error, count } = await queryBuilder

    if (error) {
      console.error("Error fetching vendors:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Format the response
    return NextResponse.json({
      vendors,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: offset + (vendors?.length || 0) < (count || 0),
      },
    })
  } catch (error) {
    console.error("Unexpected error in vendors list API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
