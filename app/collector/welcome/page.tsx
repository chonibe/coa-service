import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { WelcomeClient } from "./welcome-client"

export default async function CollectorWelcomePage() {
  const supabase = createClient()

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect("/login?redirect=/collector/welcome")
  }

  // Check if user already completed onboarding
  const { data: profile } = await supabase
    .from("collector_profiles")
    .select("onboarding_completed_at, onboarding_skipped")
    .eq("user_id", user.id)
    .single()

  // If already completed or skipped, redirect to dashboard
  if (profile?.onboarding_completed_at || profile?.onboarding_skipped) {
    redirect("/collector/dashboard")
  }

  return <WelcomeClient />
}
