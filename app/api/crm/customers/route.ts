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
      .from("collector_profile_comprehensive")
      .select("*", { count: "exact" })
      .order("last_purchase_date", { ascending: false })
      .range(offset, offset + limit - 1)

    // Add search filter if provided
    if (search) {
      query = query.or(
        `user_email.ilike.%${search}%,display_name.ilike.%${search}%,display_phone.ilike.%${search}%`
      )
    }

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    // Map the view data to match the expected CRM Customer interface
    const mappedCustomers = (data || []).map(collector => ({
      id: collector.user_id || collector.user_email,
      shopify_customer_id: collector.pii_sources?.shopify?.id || null,
      email: collector.user_email,
      first_name: collector.first_name || (collector.display_name?.split(' ')[0]) || null,
      last_name: collector.last_name || (collector.display_name?.split(' ').slice(1).join(' ')) || null,
      total_orders: collector.total_orders,
      total_spent: collector.total_spent,
      last_order_date: collector.last_purchase_date,
      created_at: collector.profile_created_at || collector.user_created_at,
      pii_sources: collector.pii_sources
    }))

    return NextResponse.json({
      customers: mappedCustomers,
      total: count || 0,
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

