import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { guardAdminRequest } from "@/lib/auth-guards"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { calculateVendorBalance } from "@/lib/vendor-balance-calculator"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const queryVendorName = searchParams.get("vendorName")

  const cookieStore = cookies()
  const sessionVendorName = getVendorFromCookieStore(cookieStore)

  let resolvedVendorName: string | null = null

  if (queryVendorName) {
    // Explicit vendor target: allow if session matches, otherwise require admin
    if (sessionVendorName && sessionVendorName === queryVendorName) {
      resolvedVendorName = queryVendorName
    } else {
      const auth = guardAdminRequest(request)
      if (auth.kind !== "ok") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      resolvedVendorName = queryVendorName
    }
  } else if (sessionVendorName) {
    // No query param: use current vendor session
    resolvedVendorName = sessionVendorName
  } else {
    // No vendor in query or session; fall back to admin-only callers
    const auth = guardAdminRequest(request)
    if (auth.kind !== "ok") {
      return auth.response
    }
    return NextResponse.json({ error: "Vendor name is required" }, { status: 400 })
  }

  try {
    if (!resolvedVendorName) {
      return NextResponse.json({ error: "Vendor name is required" }, { status: 400 })
    }

    const balance = await calculateVendorBalance(resolvedVendorName)

    return NextResponse.json({
      success: true,
      balance,
    })
  } catch (error: any) {
    console.error("Error fetching vendor balance:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch balance" }, { status: 500 })
  }
}
