import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { checkVendorPayoutReadiness } from "@/lib/vendor-payout-readiness"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const vendorName = getVendorFromCookieStore(cookieStore)

  if (!vendorName) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const supabase = createClient()
    const readiness = await checkVendorPayoutReadiness(vendorName, supabase)

    return NextResponse.json({
      success: true,
      readiness,
    })
  } catch (error: any) {
    console.error("Error checking payout readiness:", error)
    return NextResponse.json(
      { error: error.message || "Failed to check payout readiness" },
      { status: 500 }
    )
  }
}
