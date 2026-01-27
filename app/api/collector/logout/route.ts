import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { clearCollectorSessionCookie } from "@/lib/collector-session"
import { clearVendorSessionCookie } from "@/lib/vendor-session"
import { clearAdminSessionCookie } from "@/lib/admin-session"
import { REQUIRE_ACCOUNT_SELECTION_COOKIE } from "@/lib/vendor-auth"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteClient(cookieStore)

    // Sign out from Supabase auth completely
    await supabase.auth.signOut({ scope: 'global' })

    const response = NextResponse.json({ success: true })

    // Clear all session cookies to ensure complete logout
    const clearCollectorCookie = clearCollectorSessionCookie()
    response.cookies.set(clearCollectorCookie.name, "", clearCollectorCookie.options)

    const clearVendorCookie = clearVendorSessionCookie()
    response.cookies.set(clearVendorCookie.name, "", clearVendorCookie.options)

    const clearAdminCookie = clearAdminSessionCookie()
    response.cookies.set(clearAdminCookie.name, "", clearAdminCookie.options)

    // Clear shopify_customer_id cookie
    response.cookies.set("shopify_customer_id", "", { path: "/", maxAge: 0 })
    
    // Set flag to require account selection on next login
    response.cookies.set(REQUIRE_ACCOUNT_SELECTION_COOKIE, "true", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    })

    console.log("[collector/logout] Collector logged out successfully")
    return response
  } catch (error: any) {
    console.error("Error in collector logout:", error)
    return NextResponse.json({ message: error.message || "An error occurred" }, { status: 500 })
  }
}
