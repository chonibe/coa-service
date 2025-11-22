import { NextResponse } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/admin/payouts/schedules
 * Get all payout schedules
 */
export async function GET() {
  try {
    await guardAdminRequest()

    const supabase = createClient()
    const { data: schedules, error } = await supabase
      .from("payout_schedules")
      .select("*")
      .order("vendor_name")

    if (error) {
      console.error("Error fetching schedules:", error)
      return NextResponse.json(
        { error: "Failed to fetch schedules", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ schedules: schedules || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 })
  }
}

/**
 * POST /api/admin/payouts/schedules
 * Create a new payout schedule
 */
export async function POST(request: Request) {
  try {
    await guardAdminRequest()

    const body = await request.json()
    const { vendor_name, schedule_type, day_of_week, day_of_month, enabled, minimum_amount } = body

    if (!vendor_name || !schedule_type) {
      return NextResponse.json(
        { error: "vendor_name and schedule_type are required" },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Calculate next_run
    const { data: nextRunData } = await supabase.rpc("calculate_next_payout_run", {
      p_schedule_type: schedule_type,
      p_day_of_week: day_of_week || null,
      p_day_of_month: day_of_month || null,
    })

    const { data: schedule, error } = await supabase
      .from("payout_schedules")
      .insert({
        vendor_name,
        schedule_type,
        day_of_week: schedule_type === "weekly" ? day_of_week : null,
        day_of_month: schedule_type === "monthly" ? day_of_month : null,
        enabled: enabled !== false,
        minimum_amount: minimum_amount || 0,
        next_run: nextRunData || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating schedule:", error)
      return NextResponse.json(
        { error: "Failed to create schedule", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ schedule })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 })
  }
}

