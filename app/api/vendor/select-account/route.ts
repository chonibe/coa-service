import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { buildVendorSessionCookie } from "@/lib/vendor-session"
import { REQUIRE_ACCOUNT_SELECTION_COOKIE } from "@/lib/vendor-auth"
import { clearAdminSessionCookie, ADMIN_SESSION_COOKIE_NAME } from "@/lib/admin-session"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteClient(cookieStore)
    const serviceClient = createServiceClient()

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { vendorName } = (await request.json()) as { vendorName?: string }

    if (!vendorName) {
      return NextResponse.json({ error: "Vendor name is required" }, { status: 400 })
    }

    const user = session.user

    // Verify that the vendor is linked to this user
    const { data: vendorUser, error: vendorUserError } = await serviceClient
      .from("vendor_users")
      .select("vendor_id")
      .eq("auth_id", user.id)
      .maybeSingle()

    if (vendorUserError) {
      console.error("Failed to look up vendor user", vendorUserError)
      return NextResponse.json({ error: "Failed to verify vendor account" }, { status: 500 })
    }

    // Get the vendor to verify it matches
    const { data: vendor, error: vendorError } = await serviceClient
      .from("vendors")
      .select("id, vendor_name")
      .eq("vendor_name", vendorName)
      .maybeSingle()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Verify the vendor is linked to this user
    if (vendorUser?.vendor_id !== vendor.id) {
      // Try to find by email as fallback
      const email = user.email?.toLowerCase() ?? null
      if (email) {
        const { data: vendorUserByEmail } = await serviceClient
          .from("vendor_users")
          .select("vendor_id")
          .eq("email", email)
          .eq("vendor_id", vendor.id)
          .maybeSingle()

        if (!vendorUserByEmail) {
          return NextResponse.json({ error: "Vendor account not linked to your account" }, { status: 403 })
        }
      } else {
        return NextResponse.json({ error: "Vendor account not linked to your account" }, { status: 403 })
      }
    }

    // Set vendor session cookie
    const vendorCookie = buildVendorSessionCookie(vendor.vendor_name)
    const response = NextResponse.json({ success: true, vendor: { name: vendor.vendor_name } })

    response.cookies.set(vendorCookie.name, vendorCookie.value, vendorCookie.options)

    // Clear admin session cookie
    const clearAdminCookie = clearAdminSessionCookie()
    response.cookies.set(clearAdminCookie.name, "", { ...clearAdminCookie.options, maxAge: 0 })

    // Clear account selection requirement flag
    response.cookies.set(REQUIRE_ACCOUNT_SELECTION_COOKIE, "", { path: "/", maxAge: 0 })

    return response
  } catch (error: any) {
    console.error("Error in select-account:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}

