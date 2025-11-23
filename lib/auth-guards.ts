import { NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore, clearVendorSessionCookie } from "@/lib/vendor-session"
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken, clearAdminSessionCookie } from "@/lib/admin-session"
import { isAdminEmail } from "@/lib/vendor-auth"

const PENDING_ACCESS_ROUTE = "/vendor/access-pending"
const ACCESS_DENIED_ROUTE = "/vendor/access-denied"
const VENDOR_LOGIN_ROUTE = "/login"
const ADMIN_LOGIN_ROUTE = "/login"

export type GuardResult =
  | { kind: "ok"; vendorName?: string }
  | { kind: "redirect"; response: NextResponse }
  | { kind: "unauthorized"; response: NextResponse }

const buildRedirectResponse = (request: NextRequest, targetPath: string) => {
  const redirectUrl = new URL(targetPath, request.url)
  return NextResponse.redirect(redirectUrl)
}

export const guardAdminRequest = (request: NextRequest): GuardResult => {
  const adminToken = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value
  const payload = verifyAdminSessionToken(adminToken)

  if (payload?.email && isAdminEmail(payload.email)) {
    return { kind: "ok" }
  }

  // Decide response type by route (API vs page)
  if (request.nextUrl.pathname.startsWith("/api")) {
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    response.cookies.set(ADMIN_SESSION_COOKIE_NAME, "", clearAdminSessionCookie().options)
    return { kind: "unauthorized", response }
  }

  const response = buildRedirectResponse(request, ADMIN_LOGIN_ROUTE)
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, "", clearAdminSessionCookie().options)
  return { kind: "redirect", response }
}

export const guardVendorRequest = async (request: NextRequest): Promise<GuardResult> => {
  const vendorName = getVendorFromCookieStore(request.cookies)

  if (!vendorName) {
    if (request.nextUrl.pathname.startsWith("/api")) {
      return {
        kind: "unauthorized",
        response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
      }
    }

    return {
      kind: "redirect",
      response: buildRedirectResponse(request, VENDOR_LOGIN_ROUTE),
    }
  }

  const supabase = createSupabaseClient()
  const { data: vendor, error } = await supabase
    .from("vendors")
    .select("vendor_name, onboarding_completed, status")
    .eq("vendor_name", vendorName)
    .maybeSingle()

  if (error || !vendor) {
    if (request.nextUrl.pathname.startsWith("/api")) {
      return {
        kind: "unauthorized",
        response: NextResponse.json({ error: "Vendor not found" }, { status: 401 }),
      }
    }
    return {
      kind: "redirect",
      response: buildRedirectResponse(request, VENDOR_LOGIN_ROUTE),
    }
  }

  const isOnboardingPath = request.nextUrl.pathname === "/vendor/onboarding"

  if (vendor.status === "pending" || vendor.status === "review") {
    return {
      kind: "redirect",
      response: buildRedirectResponse(request, PENDING_ACCESS_ROUTE),
    }
  }

  if (vendor.status === "disabled" || vendor.status === "suspended") {
    return {
      kind: "redirect",
      response: buildRedirectResponse(request, ACCESS_DENIED_ROUTE),
    }
  }

  // Allow access to dashboard even if onboarding is not completed
  // Contextual onboarding will handle prompting for missing information
  // Only redirect away from onboarding page if already completed
  if (vendor.onboarding_completed && isOnboardingPath) {
    return {
      kind: "redirect",
      response: buildRedirectResponse(request, "/vendor/dashboard"),
    }
  }

  return { kind: "ok", vendorName }
}
