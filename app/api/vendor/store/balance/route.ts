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
    // This function accounts for refunds and other adjustments
    const { data: pendingPayouts, error: pendingPayoutsError } = await supabase.rpc(
      "get_pending_vendor_payouts"
    )

    if (pendingPayoutsError) {
      console.error("Error fetching pending payouts:", pendingPayoutsError)
      return NextResponse.json(
        { error: "Failed to calculate balance", message: pendingPayoutsError.message },
        { status: 500 }
      )
    }

    // Find the vendor's pending payout amount
    const vendorPendingPayout = pendingPayouts?.find(
      (p: any) => p.vendor_name === vendorName
    )
    const pendingPayoutAmount = vendorPendingPayout
      ? Number(vendorPendingPayout.amount)
      : 0

    console.log(`[Store Balance API] Vendor: ${vendorName}`)
    console.log(`[Store Balance API] Pending payout from RPC:`, vendorPendingPayout)
    console.log(`[Store Balance API] Pending payout amount: ${pendingPayoutAmount}`)

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

    console.log(`[Store Balance API] Store purchases from ledger:`, storePurchases)
    console.log(`[Store Balance API] Store purchases total: ${storePurchasesTotal}`)

    // Available balance = pending payout amount - store purchases
    const availableBalance = Math.max(0, pendingPayoutAmount - storePurchasesTotal)

    console.log(`[Store Balance API] Final available balance: ${availableBalance}`)

    return NextResponse.json({
      success: true,
      balance: availableBalance,
      pendingPayoutAmount,
      storePurchasesTotal,
      currency: "USD",
      debug: {
        vendorPendingPayout,
        pendingPayoutAmount,
        storePurchases,
        storePurchasesTotal,
        availableBalance,
      },
    })
  } catch (error: any) {
    console.error("Error fetching balance:", error)
    return NextResponse.json(
      { error: "Failed to fetch balance", message: error.message },
      { status: 500 }
    )
  }
}

