import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const vendorName = getVendorFromCookieStore(cookieStore)

  if (!vendorName) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { stepNumber, stepName, timeSpentSeconds, completed } = body

    if (typeof stepNumber !== "number" || !stepName) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    const supabase = createClient()

    // Insert or update analytics record
    const { error } = await supabase.from("onboarding_analytics").insert({
      vendor_name: vendorName,
      step_number: stepNumber,
      step_name: stepName,
      time_spent_seconds: timeSpentSeconds || null,
      completed: completed || false,
      exited_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error tracking onboarding analytics:", error)
      return NextResponse.json({ error: "Failed to track analytics" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in track route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


