import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { createClient as createServiceRoleClient } from "@/lib/supabase/server"
import { isAdminEmail, SIGNUP_STATUS_APPROVED, SIGNUP_STATUS_COMPLETED } from "@/lib/vendor-auth"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteClient(cookieStore)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const payload = await request.json()
    const vendorId = Number(payload?.vendorId)
    const email = String(payload?.email || "").trim().toLowerCase()

    if (!vendorId || !email) {
      return NextResponse.json({ error: "vendorId and email are required" }, { status: 400 })
    }

    const adminClient = createServiceRoleClient()

    const { data: userLookup, error: userError } = await adminClient.auth.admin.getUserByEmail(email)
    if (userError || !userLookup?.user) {
      return NextResponse.json({ error: "Supabase user not found for the provided email" }, { status: 404 })
    }

    const { data: vendor, error: vendorError } = await adminClient
      .from("vendors")
      .select("id,vendor_name,auth_id,signup_status,auth_pending_email")
      .eq("id", vendorId)
      .maybeSingle()

    if (vendorError) {
      throw new Error(vendorError.message)
    }

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    const signupStatus =
      vendor.signup_status === SIGNUP_STATUS_PENDING ? SIGNUP_STATUS_APPROVED : SIGNUP_STATUS_COMPLETED

    const { data: updated, error: updateError } = await adminClient
      .from("vendors")
      .update({
        auth_id: userLookup.user.id,
        contact_email: email,
        auth_pending_email: null,
        signup_status: signupStatus,
      })
      .eq("id", vendorId)
      .select("id,vendor_name,auth_id,signup_status")
      .maybeSingle()

    if (updateError || !updated) {
      throw new Error(updateError?.message || "Failed to link vendor")
    }

    return NextResponse.json({ success: true, vendor: updated })
  } catch (error) {
    console.error("Admin link vendor error:", error)
    const message = error instanceof Error ? error.message : "Unexpected error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

