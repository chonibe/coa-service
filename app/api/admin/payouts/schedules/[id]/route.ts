import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"

/**
 * PUT /api/admin/payouts/schedules/[id]
 * Update a payout schedule
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await guardAdminRequest()

    const body = await request.json()
    const { schedule_type, day_of_week, day_of_month, enabled, minimum_amount } = body

    const supabase = createClient()

    // Calculate next_run if schedule type changed
    let nextRun = null
    if (schedule_type && schedule_type !== "manual") {
      const { data: nextRunData } = await supabase.rpc("calculate_next_payout_run", {
        p_schedule_type: schedule_type,
        p_day_of_week: day_of_week || null,
        p_day_of_month: day_of_month || null,
      })
      nextRun = nextRunData
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (schedule_type !== undefined) {
      updateData.schedule_type = schedule_type
      updateData.day_of_week = schedule_type === "weekly" ? day_of_week : null
      updateData.day_of_month = schedule_type === "monthly" ? day_of_month : null
      updateData.next_run = nextRun
    }

    if (enabled !== undefined) updateData.enabled = enabled
    if (minimum_amount !== undefined) updateData.minimum_amount = minimum_amount

    const { data: schedule, error } = await supabase
      .from("payout_schedules")
      .update(updateData)
      .eq("id", parseInt(params.id))
      .select()
      .single()

    if (error) {
      console.error("Error updating schedule:", error)
      return NextResponse.json(
        { error: "Failed to update schedule", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ schedule })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 })
  }
}

/**
 * DELETE /api/admin/payouts/schedules/[id]
 * Delete a payout schedule
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await guardAdminRequest()

    const supabase = createClient()
    const { error } = await supabase
      .from("payout_schedules")
      .delete()
      .eq("id", parseInt(params.id))

    if (error) {
      console.error("Error deleting schedule:", error)
      return NextResponse.json(
        { error: "Failed to delete schedule", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 })
  }
}

