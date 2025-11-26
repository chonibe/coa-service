import { NextRequest, NextResponse } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  try {
    const body = await request.json()
    const supabase = createClient()

    const updateData: any = {
      name: body.name,
      frequency: body.frequency,
      day_of_week: body.dayOfWeek,
      day_of_month: body.dayOfMonth,
      auto_process: body.autoProcess,
      threshold: body.threshold,
      vendor_name: body.vendorName,
      enabled: body.enabled,
    }

    // Recalculate next run if frequency changed
    if (body.frequency) {
      updateData.next_run = calculateNextRun(body.frequency, body.dayOfWeek, body.dayOfMonth)
    }

    const { data: schedule, error } = await supabase
      .from("payout_schedules")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating schedule:", error)
      return NextResponse.json({ error: "Failed to update schedule" }, { status: 500 })
    }

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error("Error in schedule PUT route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  try {
    const supabase = createClient()

    const { error } = await supabase.from("payout_schedules").delete().eq("id", params.id)

    if (error) {
      console.error("Error deleting schedule:", error)
      return NextResponse.json({ error: "Failed to delete schedule" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in schedule DELETE route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function calculateNextRun(
  frequency: string,
  dayOfWeek?: number,
  dayOfMonth?: number
): string {
  const now = new Date()
  let nextRun = new Date()

  switch (frequency) {
    case "weekly":
      if (dayOfWeek) {
        const daysUntil = (dayOfWeek - now.getDay() + 7) % 7 || 7
        nextRun.setDate(now.getDate() + daysUntil)
      } else {
        nextRun.setDate(now.getDate() + 7)
      }
      break
    case "bi-weekly":
      nextRun.setDate(now.getDate() + 14)
      break
    case "monthly":
      if (dayOfMonth) {
        nextRun.setMonth(now.getMonth() + 1)
        nextRun.setDate(dayOfMonth)
      } else {
        nextRun.setMonth(now.getMonth() + 1)
      }
      break
  }

  return nextRun.toISOString()
}


