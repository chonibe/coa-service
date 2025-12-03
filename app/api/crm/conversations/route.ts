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
    const platform = searchParams.get("platform") // 'email' | 'instagram' | null
    const status = searchParams.get("status") // 'open' | 'closed' | 'pending' | null
    const customerId = searchParams.get("customer_id")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    let query = supabase
      .from("crm_conversations")
      .select(`
        *,
        crm_customers (
          id,
          email,
          first_name,
          last_name,
          instagram_username
        )
      `)
      .order("last_message_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Add filters
    if (platform) {
      query = query.eq("platform", platform)
    }
    if (status) {
      query = query.eq("status", status)
    }
    if (customerId) {
      query = query.eq("customer_id", customerId)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    // Get total count for pagination
    let countQuery = supabase
      .from("crm_conversations")
      .select("*", { count: "exact", head: true })

    if (platform) {
      countQuery = countQuery.eq("platform", platform)
    }
    if (status) {
      countQuery = countQuery.eq("status", status)
    }
    if (customerId) {
      countQuery = countQuery.eq("customer_id", customerId)
    }

    const { count: totalCount } = await countQuery

    return NextResponse.json({
      conversations: data || [],
      total: totalCount || 0,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error("[CRM] Error fetching conversations:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

