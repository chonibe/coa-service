import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"

export async function middleware(request: NextRequest) {
  const vendorName = getVendorFromCookieStore(request.cookies)

  if (!vendorName) {
    const loginUrl = new URL("/vendor/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  const supabase = createClient()
  const { data: vendor, error } = await supabase
    .from("vendors")
    .select("vendor_name, onboarding_completed")
    .eq("vendor_name", vendorName)
    .single()

  if (error || !vendor) {
    const loginUrl = new URL("/vendor/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  const isOnboardingPath = request.nextUrl.pathname === "/vendor/onboarding"

  if (!vendor.onboarding_completed && !isOnboardingPath && request.nextUrl.pathname !== "/vendor/login") {
    const onboardingUrl = new URL("/vendor/onboarding", request.url)
    return NextResponse.redirect(onboardingUrl)
  }

  if (vendor.onboarding_completed && isOnboardingPath) {
    const dashboardUrl = new URL("/vendor/dashboard", request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/vendor/:path*"],
}
