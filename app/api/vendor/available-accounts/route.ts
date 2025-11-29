import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { isAdminEmail } from "@/lib/vendor-auth"

export async function GET() {
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

    const user = session.user
    const email = user.email?.toLowerCase() ?? null

    // Admins don't need vendor account selection
    if (email && isAdminEmail(email)) {
      return NextResponse.json({ error: "Admin users do not need vendor account selection" }, { status: 400 })
    }

    // Find vendor linked to this auth_id
    const { data: vendorUser, error: vendorUserError } = await serviceClient
      .from("vendor_users")
      .select("vendor_id")
      .eq("auth_id", user.id)
      .maybeSingle()

    if (vendorUserError) {
      console.error("Failed to look up vendor user", vendorUserError)
      return NextResponse.json({ error: "Failed to look up vendor account" }, { status: 500 })
    }

    if (!vendorUser?.vendor_id) {
      // Try to find by email
      if (email) {
        const { data: vendorUserByEmail, error: emailError } = await serviceClient
          .from("vendor_users")
          .select("vendor_id")
          .eq("email", email)
          .maybeSingle()

        if (emailError) {
          console.error("Failed to look up vendor user by email", emailError)
        } else if (vendorUserByEmail?.vendor_id) {
          const { data: vendor, error: vendorError } = await serviceClient
            .from("vendors")
            .select("id, vendor_name, status")
            .eq("id", vendorUserByEmail.vendor_id)
            .maybeSingle()

          if (vendorError) {
            console.error("Failed to load vendor", vendorError)
            return NextResponse.json({ error: "Failed to load vendor account" }, { status: 500 })
          }

          if (vendor) {
            return NextResponse.json({ vendor })
          }
        }
      }

      return NextResponse.json({ vendor: null })
    }

    const { data: vendor, error: vendorError } = await serviceClient
      .from("vendors")
      .select("id, vendor_name, status")
      .eq("id", vendorUser.vendor_id)
      .maybeSingle()

    if (vendorError) {
      console.error("Failed to load vendor", vendorError)
      return NextResponse.json({ error: "Failed to load vendor account" }, { status: 500 })
    }

    return NextResponse.json({ vendor })
  } catch (error: any) {
    console.error("Error in available-accounts:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}

