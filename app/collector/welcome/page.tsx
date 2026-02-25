export const dynamic = 'force-dynamic'

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { WelcomeClient } from "./welcome-client"
import { verifyClaimToken } from "@/lib/auth/claim-token"

/**
 * Collector Welcome / Claim Page
 * 
 * Two entry paths:
 * 1. Authenticated user → standard onboarding wizard
 * 2. Token-based claim → ?email={email}&token={signedToken} from purchase email
 *    Creates account via OTP if needed, then links purchases.
 * 
 * @see lib/auth/claim-token.ts - Token generation and verification
 * @see app/api/stripe/webhook/route.ts - Sends claim email after purchase
 */
export default async function CollectorWelcomePage({
  searchParams,
}: {
  searchParams: { email?: string; token?: string }
}) {
  const supabase = createClient()

  // ── Token-based claim path (from purchase email link) ──
  const claimEmail = searchParams?.email
  const claimToken = searchParams?.token

  if (claimEmail && claimToken) {
    const payload = verifyClaimToken(claimToken)

    if (payload && payload.email === claimEmail.toLowerCase().trim()) {
      // Valid claim token — attempt to sign in or create account
      // signInWithOtp sends a magic link; if user already exists they just log in
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: claimEmail,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || ''}/auth/callback?from=claim`,
        },
      })

      if (otpError) {
        console.error('[welcome] OTP sign-in error:', otpError)
      }

      // Link purchase to profile if profile exists but has no user_id
      const { data: stubProfile } = await supabase
        .from("collector_profiles")
        .select("id, user_id")
        .eq("email", claimEmail.toLowerCase())
        .maybeSingle()

      // Render the claim-specific welcome page
      return (
        <WelcomeClient
          claimEmail={claimEmail}
          claimPurchaseId={payload.purchaseId}
          profileExists={!!stubProfile}
        />
      )
    }

    // Invalid/expired token — fall through to standard auth check
    console.warn('[welcome] Invalid or expired claim token for:', claimEmail)
  }

  // ── Standard authenticated path ──
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
