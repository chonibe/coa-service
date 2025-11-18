import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { clearAdminSessionCookie } from "@/lib/admin-session"
import { clearVendorSessionCookie } from "@/lib/vendor-session"

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true })
    const clearAdminCookie = clearAdminSessionCookie()
    const clearVendorCookie = clearVendorSessionCookie()
    response.cookies.set(clearAdminCookie.name, "", clearAdminCookie.options)
    response.cookies.set(clearVendorCookie.name, "", clearVendorCookie.options)

    return response
  } catch (error: any) {
    console.error("Error in admin logout:", error)
    return NextResponse.json({ message: error.message || "An error occurred" }, { status: 500 })
  }
}
