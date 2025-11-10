import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import {
  createVendorSignup,
  requestVendorClaimByInvite,
  resolveVendorAuthState,
  SIGNUP_STATUS_PENDING,
  SIGNUP_STATUS_APPROVED,
} from "@/lib/vendor-auth"
import { buildVendorSessionCookie } from "@/lib/vendor-session"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteClient(cookies())
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await request.json()
    const action = payload?.action

    if (action === "create") {
      const vendorName = String(payload?.vendorName || "").trim()

      if (!vendorName) {
        return NextResponse.json({ error: "Vendor name is required" }, { status: 400 })
      }

      const resolution = await resolveVendorAuthState(session.user)

      if (resolution.status === "linked") {
        return NextResponse.json(
          { error: "An active vendor is already linked to this account", vendor: resolution.vendor },
          { status: 409 },
        )
      }

      const { vendor, inviteCode } = await createVendorSignup(session.user, vendorName)

      const response = NextResponse.json({
        success: true,
        status: SIGNUP_STATUS_APPROVED,
        vendor,
        inviteCode,
      })

      const sessionCookie = buildVendorSessionCookie(vendor.vendor_name)
      response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.options)

      return response
    }

    if (action === "claim") {
      const inviteCode = String(payload?.inviteCode || "").trim()

      if (!inviteCode) {
        return NextResponse.json({ error: "Invite code is required" }, { status: 400 })
      }

      const { vendor } = await requestVendorClaimByInvite(session.user, inviteCode)

      return NextResponse.json({
        success: true,
        status: SIGNUP_STATUS_PENDING,
        vendor,
      })
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 })
  } catch (error) {
    console.error("Vendor signup error:", error)
    const message = error instanceof Error ? error.message : "Unexpected error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

