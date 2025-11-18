import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { buildVendorSessionCookie } from "@/lib/vendor-session"
import { isAdminEmail } from "@/lib/vendor-auth"
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"
import { logImpersonation } from "@/lib/audit-logger"

type ImpersonateRequest = {
  vendorId?: number
  vendorName?: string
}

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createRouteClient(cookieStore)

  const adminToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value
  const adminSession = verifyAdminSessionToken(adminToken)
  if (!adminSession?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const email = session.user.email?.toLowerCase() ?? ""
  if (!isAdminEmail(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let payload: ImpersonateRequest
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { vendorId, vendorName } = payload
  if (!vendorId && !vendorName) {
    return NextResponse.json({ error: "Vendor identifier required" }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  let query = serviceClient.from("vendors").select("id,vendor_name").limit(1)

  if (vendorId) {
    query = query.eq("id", vendorId)
  } else if (vendorName) {
    query = query.eq("vendor_name", vendorName)
  }

  const { data: vendor, error: fetchError } = await query.maybeSingle()

  if (fetchError) {
    console.error("Failed to locate vendor for impersonation:", fetchError)
    return NextResponse.json({ error: "Unable to fetch vendor" }, { status: 500 })
  }

  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
  }

  const response = NextResponse.json({ success: true, vendor })
  const sessionCookie = buildVendorSessionCookie(vendor.vendor_name)
  response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.options)

  await logImpersonation({
    adminEmail: email,
    vendorId: vendor.id ?? null,
    vendorName: vendor.vendor_name ?? null,
  })

  return response
}

