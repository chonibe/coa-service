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
      .select("id, vendor_name")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Get pending payout amount (ready to request) using the same function as payout redeem
    const { data: pendingLineItems, error: lineItemsError } = await supabase.rpc(
      "get_vendor_pending_line_items",
      {
        p_vendor_name: vendorName,
      }
    )

    if (lineItemsError) {
      console.error("Error fetching pending line items:", lineItemsError)
      return NextResponse.json(
        { error: "Failed to calculate balance", message: lineItemsError.message },
        { status: 500 }
      )
    }

    // Calculate total pending payout amount
    let pendingPayoutAmount = 0
    if (pendingLineItems && pendingLineItems.length > 0) {
      pendingLineItems.forEach((item: any) => {
        const price = typeof item.price === "string" ? parseFloat(item.price || "0") : item.price || 0
        if (item.is_percentage) {
          pendingPayoutAmount += (price * item.payout_amount) / 100
        } else {
          pendingPayoutAmount += item.payout_amount
        }
      })
    }

    // Subtract store purchases made from balance (from ledger entries)
    const { data: storePurchases, error: storePurchasesError } = await supabase
      .from("vendor_ledger_entries")
      .select("amount")
      .eq("vendor_name", vendorName)
      .eq("entry_type", "store_purchase")

    if (storePurchasesError) {
      console.error("Error fetching store purchases:", storePurchasesError)
      // Continue with calculation even if this fails
    }

    let storePurchasesTotal = 0
    storePurchases?.forEach((entry) => {
      storePurchasesTotal += Math.abs(Number(entry.amount)) || 0
    })

    // Available balance = pending payout amount - store purchases
    const availableBalance = Math.max(0, pendingPayoutAmount - storePurchasesTotal)

    return NextResponse.json({
      success: true,
      balance: availableBalance,
      pendingPayoutAmount,
      storePurchasesTotal,
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

