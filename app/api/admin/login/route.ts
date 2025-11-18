import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { isAdminEmail } from "@/lib/vendor-auth"
import { buildAdminSessionCookie } from "@/lib/admin-session"

export async function POST(_request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createRouteClient(cookieStore)

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("Failed to retrieve Supabase session for admin login:", error)
      return NextResponse.json({ message: "Unable to verify session" }, { status: 500 })
    }

    const email = session?.user?.email?.toLowerCase()
    if (!email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (!isAdminEmail(email)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const response = NextResponse.json({ success: true })
    const adminCookie = buildAdminSessionCookie(email)
    response.cookies.set(adminCookie.name, adminCookie.value, adminCookie.options)
    return response
  } catch (error: any) {
    console.error("Error in admin login:", error)
    return NextResponse.json({ message: error.message || "An error occurred" }, { status: 500 })
  }
}
