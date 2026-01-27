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

    // Update profile to mark onboarding as skipped
    const { error: updateError } = await supabase
      .from("collector_profiles")
      .update({
        onboarding_skipped: true,
        onboarding_step: 0, // Stay at step 0 if skipped
      })
      .eq("user_id", user.id)

    if (updateError) {
      console.error("Error updating onboarding skip status:", updateError)
      return NextResponse.json({ error: "Failed to update onboarding status" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in skip route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
