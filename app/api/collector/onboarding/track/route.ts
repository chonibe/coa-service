import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { stepNumber, stepName, timeSpentSeconds, completed } = body

    if (typeof stepNumber !== "number" || !stepName) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    // Get user email
    const { data: profile } = await supabase
      .from("collector_profiles")
      .select("email")
      .eq("user_id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Insert analytics record
    const { error } = await supabase.from("collector_onboarding_analytics").insert({
      collector_email: profile.email,
      user_id: user.id,
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
