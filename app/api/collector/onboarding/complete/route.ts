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

    // Get profile to get email
    const { data: profile } = await supabase
      .from("collector_profiles")
      .select("email")
      .eq("user_id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Update profile to mark onboarding as completed
    const { error: updateError } = await supabase
      .from("collector_profiles")
      .update({
        onboarding_completed_at: new Date().toISOString(),
        onboarding_step: 4, // Final step
      })
      .eq("user_id", user.id)

    if (updateError) {
      console.error("Error updating onboarding status:", updateError)
      return NextResponse.json({ error: "Failed to update onboarding status" }, { status: 500 })
    }

    // Award bonus 100 credits for completing onboarding
    const { error: creditError } = await supabase
      .from("collector_ledger_entries")
      .insert({
        collector_identifier: profile.email,
        transaction_type: "signup_bonus",
        amount: 100,
        currency: "CREDITS",
        description: "Onboarding completion bonus! 🎉",
        created_by: "system",
        metadata: {
          source: "onboarding_completion",
          user_id: user.id,
        },
      })

    if (creditError) {
      console.warn("Error awarding completion bonus (non-critical):", creditError)
      // Continue anyway - credits are nice but not critical
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in complete route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
