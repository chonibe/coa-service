import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { calculateUnlockStatus } from "@/lib/pricing/unlock-system"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()

    // Get total sales (line items sold) for this vendor
    const { data: lineItems, error } = await supabase
      .from("order_line_items_v2")
      .select("id, quantity")
      .eq("vendor_name", vendorName)
      .eq("status", "active")

    if (error) {
      console.error("Error fetching vendor sales:", error)
      return NextResponse.json({ error: "Failed to fetch sales data" }, { status: 500 })
    }

    // Calculate total sales (sum of quantities)
    const totalSales = lineItems?.reduce((sum, item) => {
      const quantity = typeof item.quantity === "number" ? item.quantity : Number.parseInt(String(item.quantity || "0"), 10)
      return sum + quantity
    }, 0) || 0

    // Calculate unlock status
    const unlockStatus = calculateUnlockStatus(totalSales)

    return NextResponse.json(unlockStatus)
  } catch (error: any) {
    console.error("Error in unlock status API:", error)
    return NextResponse.json(
      { error: "Failed to fetch unlock status", message: error.message },
      { status: 500 },
    )
  }
}

