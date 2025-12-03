import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    let query = supabase
      .from("crm_customers")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Add search filter if provided
    if (search) {
      query = query.or(
        `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,instagram_username.ilike.%${search}%`
      )
    }

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from("crm_customers")
      .select("*", { count: "exact", head: true })

    return NextResponse.json({
      customers: data || [],
      total: totalCount || 0,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error("[CRM] Error fetching customers:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

