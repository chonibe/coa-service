import { getSupabaseUrl, getSupabaseKey } from '@/lib/supabase/client-utils'
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase-client"

export async function middleware(request: NextRequest) {
  // Create a Supabase client
  const supabase = createClient()

  // Get the session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If no session, redirect to login
  if (!session) {
    const loginUrl = new URL("/vendor/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Check if the user is a vendor
  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, onboarding_completed")
    .eq("auth_id", session.user.id)
    .single()

  // If not a vendor, redirect to login
  if (!vendor) {
    const loginUrl = new URL("/vendor/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  // If onboarding is not completed and not already on the onboarding page, redirect to onboarding
  const isOnboardingPath = request.nextUrl.pathname === "/vendor/onboarding"
  if (!vendor.onboarding_completed && !isOnboardingPath && request.nextUrl.pathname !== "/vendor/login") {
    const onboardingUrl = new URL("/vendor/onboarding", request.url)
    return NextResponse.redirect(onboardingUrl)
  }

  // If onboarding is completed and on the onboarding page, redirect to dashboard
  if (vendor.onboarding_completed && isOnboardingPath) {
    const dashboardUrl = new URL("/vendor/dashboard", request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/vendor/:path*"],
}
