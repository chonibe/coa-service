import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const cookieStore = cookies()
  const vendorName = getVendorFromCookieStore(cookieStore)

  if (!vendorName) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    // Get vendor info
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, vendor_name, auth_id")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Get vendor's collector identifier (auth_id)
    const collectorIdentifier = vendor.auth_id || vendorName
    if (!collectorIdentifier) {
      return NextResponse.json(
        { error: "Vendor does not have an auth_id" },
        { status: 400 }
      )
    }

    // Get USD balance from unified collector banking system
    const { getUsdBalance } = await import("@/lib/banking/balance-calculator")
    const usdBalance = await getUsdBalance(collectorIdentifier)

    return NextResponse.json({
      success: true,
      balance: usdBalance,
      currency: "USD",
    })
  } catch (error: any) {
    console.error("Error fetching balance:", error)
    return NextResponse.json(
      { error: "Failed to fetch balance", message: error.message },
      { status: 500 }
    )
  }
}

