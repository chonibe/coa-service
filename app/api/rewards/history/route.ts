import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get("customer_id")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 })
    }

    const supabase = createClient()

    // Calculate offset
    const offset = (page - 1) * limit

    // Get reward events with pagination
    const { data: events, error: eventsError, count } = await supabase
      .from("reward_events")
      .select("*", { count: "exact" })
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (eventsError) {
      throw eventsError
    }

    // Get total points
    const { data: rewards, error: rewardsError } = await supabase
      .from("customer_rewards")
      .select("points, level")
      .eq("customer_id", customerId)
      .single()

    if (rewardsError && rewardsError.code !== "PGRST116") {
      throw rewardsError
    }

    return NextResponse.json({
      events,
      total_events: count,
      current_page: page,
      total_pages: Math.ceil((count || 0) / limit),
      total_points: rewards?.points || 0,
      current_level: rewards?.level || "bronze"
    })
  } catch (error: any) {
    console.error("Error fetching rewards history:", error)
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    )
  }
} 