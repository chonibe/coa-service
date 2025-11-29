import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { linkSupabaseUserToVendor, isAdminEmail, REQUIRE_ACCOUNT_SELECTION_COOKIE } from "@/lib/vendor-auth"
import { buildVendorSessionCookie, clearVendorSessionCookie } from "@/lib/vendor-session"
import {
  buildAdminSessionCookie,
  clearAdminSessionCookie,
  ADMIN_SESSION_COOKIE_NAME,
} from "@/lib/admin-session"
import { logFailedLoginAttempt } from "@/lib/audit-logger"

const ADMIN_DASHBOARD_REDIRECT = "/admin/dashboard"
const VENDOR_DASHBOARD_REDIRECT = "/vendor/dashboard"
const NOT_REGISTERED_MESSAGE = "User is not registered. Please contact support@thestreetlamp.com."

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createRouteClient(cookieStore)

  try {
    const { email, password } = (await request.json()) as { email?: string; password?: string }

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required." }, { status: 400 })
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.session) {
      await logFailedLoginAttempt({
        email,
        method: "email",
        reason: error?.message || "Invalid credentials",
      })
      return NextResponse.json({ message: error?.message || "Invalid credentials." }, { status: 401 })
    }

    const { user } = data.session
    const normalizedEmail = user.email?.toLowerCase() ?? ""
    const isAdmin = isAdminEmail(normalizedEmail)

    // Always clear any lingering vendor/admin cookies before re-setting.
    const clearVendorCookie = clearVendorSessionCookie()
    const clearAdminCookie = clearAdminSessionCookie()

    // For admins, skip vendor linking and go straight to admin dashboard
    if (isAdmin) {
      const response = NextResponse.json({ redirect: ADMIN_DASHBOARD_REDIRECT })
      response.cookies.set(clearVendorCookie.name, "", clearVendorCookie.options)
      const adminCookie = buildAdminSessionCookie(normalizedEmail)
      response.cookies.set(adminCookie.name, adminCookie.value, adminCookie.options)
      return response
    }

    // For non-admins, try to link vendor
    const vendor = await linkSupabaseUserToVendor(user, { allowCreate: false })

    if (vendor) {
      const response = NextResponse.json({ redirect: VENDOR_DASHBOARD_REDIRECT })
      response.cookies.set(clearAdminCookie.name, "", clearAdminCookie.options)
      const vendorCookie = buildVendorSessionCookie(vendor.vendor_name)
      response.cookies.set(vendorCookie.name, vendorCookie.value, vendorCookie.options)
      // Clear account selection requirement flag after successful login
      response.cookies.set(REQUIRE_ACCOUNT_SELECTION_COOKIE, "", { path: "/", maxAge: 0 })
      return response
    }

    await supabase.auth.signOut()

    await logFailedLoginAttempt({
      email,
      method: "email",
      reason: "User not registered as vendor",
    })

    const failureResponse = NextResponse.json({ message: NOT_REGISTERED_MESSAGE }, { status: 403 })
    failureResponse.cookies.set(clearVendorCookie.name, "", clearVendorCookie.options)
    failureResponse.cookies.set(clearAdminCookie.name, "", clearAdminCookie.options)
    return failureResponse
  } catch (error) {
    console.error("Email login error:", error)
    return NextResponse.json({ message: "Unable to sign in right now." }, { status: 500 })
  }
}

