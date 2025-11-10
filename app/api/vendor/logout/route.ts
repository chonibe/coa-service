import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { VENDOR_SESSION_COOKIE_NAME, clearVendorSessionCookie } from "@/lib/vendor-session"
import { POST_LOGIN_REDIRECT_COOKIE, PENDING_VENDOR_EMAIL_COOKIE } from "@/lib/vendor-auth"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteClient(cookieStore)

    await supabase.auth.signOut()

    const response = NextResponse.json({ success: true })

    const clearVendorCookie = clearVendorSessionCookie()
    response.cookies.set(clearVendorCookie.name, "", clearVendorCookie.options)
    response.cookies.set(POST_LOGIN_REDIRECT_COOKIE, "", { path: "/", maxAge: 0 })
    response.cookies.set(PENDING_VENDOR_EMAIL_COOKIE, "", { path: "/", maxAge: 0 })

    return response
  } catch (error: any) {
    console.error("Error in vendor logout:", error)
    return NextResponse.json({ message: error.message || "An error occurred" }, { status: 500 })
  }
}
