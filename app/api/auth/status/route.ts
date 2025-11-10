import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { isAdminEmail, resolveVendorAuthState } from "@/lib/vendor-auth"

export async function GET() {
  const cookieStore = cookies()
  const supabase = createRouteClient(cookieStore)

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    console.error("Failed to fetch Supabase session:", error)
  }

  const user = session?.user ?? null
  const email = user?.email?.toLowerCase() ?? null
  const isAdmin = isAdminEmail(email)
  const vendorSessionName = getVendorFromCookieStore(cookieStore)

  const serviceClient = createServiceClient()

  let vendor = null as null | { id: number; vendor_name: string }
  let state: "admin" | "linked" | "pending" | "unlinked" | null = null

  if (user) {
    const resolution = await resolveVendorAuthState(user)
    state = resolution.status

    if (vendorSessionName) {
      const { data } = await serviceClient
        .from("vendors")
        .select("id,vendor_name")
        .eq("vendor_name", vendorSessionName)
        .maybeSingle()
      vendor = data ?? null
    } else if (resolution.status === "linked" || resolution.status === "pending") {
      vendor = resolution.vendor ?? null
    } else if (user.id && !vendor) {
      const { data } = await serviceClient
        .from("vendors")
        .select("id,vendor_name")
        .eq("auth_id", user.id)
        .maybeSingle()

      if (data) {
        vendor = data
      }
    }
  }

  return NextResponse.json({
    authenticated: !!user,
    user: user
      ? {
          id: user.id,
          email,
          app_metadata: user.app_metadata,
        }
      : null,
    isAdmin,
    vendorSession: vendorSessionName,
    vendor,
    state,
  })
}

