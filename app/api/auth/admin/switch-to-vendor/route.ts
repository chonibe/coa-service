import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { getUserActiveRoles, getUserVendorId } from "@/lib/rbac/role-helpers"
import { buildVendorSessionCookie } from "@/lib/vendor-session"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServiceClient()

    // Get the user from the session
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = user.id

    // Check if user has admin role or vendor role
    const roles = await getUserActiveRoles(userId)
    const isAdmin = roles.includes('admin')
    const isVendor = roles.includes('vendor')

    if (!isAdmin && !isVendor) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // For admin users, get their vendor ID
    let vendorId: number | null = null

    if (isAdmin) {
      vendorId = await getUserVendorId(userId)
    } else if (isVendor) {
      vendorId = await getUserVendorId(userId)
    }

    if (!vendorId) {
      return NextResponse.json({ error: "No vendor association found" }, { status: 404 })
    }

    // Build vendor session cookie
    const vendorCookie = buildVendorSessionCookie({
      vendorId: vendorId.toString(),
      email: user.email || '',
      issuedAt: Date.now(),
    })

    // Redirect to vendor dashboard
    const redirectResponse = NextResponse.redirect(new URL('/vendor/dashboard', request.nextUrl.origin), { status: 302 })

    // Clear collector session cookie and set vendor session cookie
    redirectResponse.cookies.delete('collector_session')
    redirectResponse.cookies.set(vendorCookie.name, vendorCookie.value, vendorCookie.options)

    return redirectResponse

  } catch (error) {
    console.error('[switch-to-vendor] Error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}