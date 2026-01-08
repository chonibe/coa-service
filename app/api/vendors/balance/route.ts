import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { cookies } from "next/headers"
import { calculateVendorBalance } from "@/lib/vendor-balance-calculator"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const vendorName = searchParams.get("vendorName")

  // Check if this is a vendor request
  if (vendorName) {
    const cookieStore = cookies()
    const sessionVendorName = getVendorFromCookieStore(cookieStore)
    if (sessionVendorName !== vendorName) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  } else {
    // Admin request
    const auth = guardAdminRequest(request)
    if (auth.kind !== "ok") {
      return auth.response
    }
  }

  try {
    if (!vendorName) {
      return NextResponse.json({ error: "Vendor name is required" }, { status: 400 })
    }

    const balance = await calculateVendorBalance(vendorName)

    return NextResponse.json({
      success: true,
      balance,
    })
  } catch (error: any) {
    console.error("Error fetching vendor balance:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch balance" }, { status: 500 })
  }
}






