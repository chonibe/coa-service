import { NextRequest, NextResponse } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { logAdminAction } from "@/lib/audit-logger"
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"

export async function GET(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  const cookieStore = request.cookies
  const adminToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value
  const adminSession = verifyAdminSessionToken(adminToken)
  const adminEmail = adminSession?.email || "unknown"

  const vendorId = Number.parseInt(params.vendorId, 10)
  if (Number.isNaN(vendorId)) {
    return NextResponse.json({ error: "Invalid vendor ID" }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  try {
    // Fetch vendor settings/details
    const { data: vendor, error: vendorError } = await serviceClient
      .from("vendors")
      .select("*")
      .eq("id", vendorId)
      .maybeSingle()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Fetch vendor user mapping
    const { data: vendorUser, error: vendorUserError } = await serviceClient
      .from("vendor_users")
      .select("email, auth_id")
      .eq("vendor_id", vendorId)
      .maybeSingle()

    // Log admin view action
    await logAdminAction({
      adminEmail,
      actionType: "view",
      vendorId,
      details: { viewType: "settings" },
    })

    return NextResponse.json({
      vendor: {
        id: vendor.id,
        vendor_name: vendor.vendor_name,
        status: vendor.status,
        contact_email: vendor.contact_email,
        onboarding_completed: vendor.onboarding_completed,
        created_at: vendor.created_at,
        last_login_at: vendor.last_login_at,
        onboarded_at: vendor.onboarded_at,
        instagram_url: vendor.instagram_url,
        notes: vendor.notes,
      },
      vendorUser: vendorUser
        ? {
            email: vendorUser.email,
            hasAuth: !!vendorUser.auth_id,
          }
        : null,
    })
  } catch (error) {
    console.error("Error fetching vendor settings for admin:", error)
    return NextResponse.json(
      { error: "Failed to fetch vendor settings" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  const cookieStore = request.cookies
  const adminToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value
  const adminSession = verifyAdminSessionToken(adminToken)
  const adminEmail = adminSession?.email || "unknown"

  const vendorId = Number.parseInt(params.vendorId, 10)
  if (Number.isNaN(vendorId)) {
    return NextResponse.json({ error: "Invalid vendor ID" }, { status: 400 })
  }

  let payload: Record<string, any>
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  try {
    // Update vendor settings
    const { data: updatedVendor, error: updateError } = await serviceClient
      .from("vendors")
      .update({
        ...payload,
        last_modified: new Date().toISOString(),
      })
      .eq("id", vendorId)
      .select()
      .maybeSingle()

    if (updateError || !updatedVendor) {
      return NextResponse.json(
        { error: "Failed to update vendor settings" },
        { status: 500 }
      )
    }

    // Log admin update action
    await logAdminAction({
      adminEmail,
      actionType: "update",
      vendorId,
      details: { updatedFields: Object.keys(payload) },
    })

    return NextResponse.json({
      success: true,
      vendor: updatedVendor,
    })
  } catch (error) {
    console.error("Error updating vendor settings:", error)
    return NextResponse.json(
      { error: "Failed to update vendor settings" },
      { status: 500 }
    )
  }
}

