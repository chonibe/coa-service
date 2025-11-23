import { NextRequest, NextResponse } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const vendorName = searchParams.get("vendorName")

  // Auth check
  if (vendorName) {
    const cookieStore = cookies()
    const sessionVendorName = getVendorFromCookieStore(cookieStore)
    if (sessionVendorName !== vendorName) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  } else {
    const auth = guardAdminRequest(request)
    if (auth.kind !== "ok") {
      return auth.response
    }
  }

  try {
    const supabase = createClient()

    let query = supabase.from("payout_schedules").select("*").order("created_at", { ascending: false })

    if (vendorName) {
      query = query.eq("vendor_name", vendorName)
    }

    const { data: schedules, error } = await query

    if (error) {
      console.error("Error fetching schedules:", error)
      return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 })
    }

    return NextResponse.json({ schedules: schedules || [] })
  } catch (error) {
    console.error("Error in schedules route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  try {
    const body = await request.json()
    const supabase = createClient()

    // Calculate next run date
    const nextRun = calculateNextRun(body.frequency, body.dayOfWeek, body.dayOfMonth)

    const { data: schedule, error } = await supabase
      .from("payout_schedules")
      .insert({
        name: body.name,
        frequency: body.frequency,
        day_of_week: body.dayOfWeek,
        day_of_month: body.dayOfMonth,
        auto_process: body.autoProcess,
        threshold: body.threshold,
        vendor_name: body.vendorName,
        enabled: body.enabled,
        next_run: nextRun,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating schedule:", error)
      return NextResponse.json({ error: "Failed to create schedule" }, { status: 500 })
    }

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error("Error in schedules POST route:", error)
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

