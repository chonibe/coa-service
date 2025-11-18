import { NextRequest, NextResponse } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { logAdminAction } from "@/lib/audit-logger"
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"

interface UpdateEmailPayload {
  vendorId?: number
  email?: string
}

const normalizeEmail = (email: string | undefined | null) => email?.trim().toLowerCase() ?? null

export async function POST(request: NextRequest) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  let payload: UpdateEmailPayload
  try {
    payload = (await request.json()) as UpdateEmailPayload
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  const vendorId = payload.vendorId
  const email = normalizeEmail(payload.email)

  if (!vendorId || !email) {
    return NextResponse.json({ error: "vendorId and email are required" }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: vendor, error: vendorError } = await supabase
    .from("vendors")
    .select("id,vendor_name")
    .eq("id", vendorId)
    .maybeSingle()

  if (vendorError || !vendor) {
    console.error("Failed to find vendor for update", vendorError)
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
  }

  const updateVendor = supabase
    .from("vendors")
    .update({ contact_email: email, last_modified: new Date().toISOString() })
    .eq("id", vendorId)

  // Upsert vendor_users - this allows admin to assign email before user signs up
  // The auth_id will be attached when the user first logs in
  const upsertVendorUser = supabase.from("vendor_users").upsert(
    {
      vendor_id: vendorId,
      email,
      // auth_id is null initially - will be set when user logs in
    },
    {
      onConflict: "vendor_id",
    },
  )

  const [{ error: vendorUpdateError }, { error: vendorUserError }] = await Promise.all([
    updateVendor,
    upsertVendorUser,
  ])

  if (vendorUserError && vendorUserError.code === "23505") {
    const { data: existing, error: fetchError } = await supabase
      .from("vendor_users")
      .select("id,vendor_id")
      .eq("email", email)
      .maybeSingle()

    if (fetchError) {
      console.error("Failed to resolve duplicate vendor user", fetchError)
      return NextResponse.json({ error: "Failed to update vendor email" }, { status: 500 })
    }

    if (existing && existing.vendor_id !== vendorId) {
      await supabase.from("vendor_users").delete().eq("id", existing.id)
    }

    const retryInsert = await supabase
      .from("vendor_users")
      .upsert({
        vendor_id: vendorId,
        email,
      }, { onConflict: "vendor_id" })

    if (retryInsert.error) {
      console.error("Failed to update vendor user after resolving duplicate", retryInsert.error)
      return NextResponse.json({ error: "Failed to update vendor email" }, { status: 500 })
    }
  } else if (vendorUserError) {
    console.error("Failed to update vendor email", vendorUserError)
    return NextResponse.json({ error: "Failed to update vendor email" }, { status: 500 })
  }

  if (vendorUpdateError) {
    console.error("Failed to update vendor email", vendorUpdateError)
    return NextResponse.json({ error: "Failed to update vendor email" }, { status: 500 })
  }

  // Log admin action
  const adminToken = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value
  const adminSession = verifyAdminSessionToken(adminToken)
  const adminEmail = adminSession?.email || "unknown"
  
  await logAdminAction({
    adminEmail,
    actionType: "update",
    vendorId,
    details: { field: "contact_email", newValue: email },
  })

  return NextResponse.json({
    success: true,
    vendor: {
      id: vendor.id,
      vendor_name: vendor.vendor_name,
      contact_email: email,
    },
  })
}
