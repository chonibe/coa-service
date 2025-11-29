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

    // Calculate available balance from ledger entries
    // Positive entries (payouts) minus negative entries (refunds, store purchases)
    const { data: ledgerEntries, error: ledgerError } = await supabase
      .from("vendor_ledger_entries")
      .select("amount, entry_type")
      .eq("vendor_name", vendorName)

    if (ledgerError) {
      console.error("Error fetching ledger entries:", ledgerError)
      return NextResponse.json(
        { error: "Failed to calculate balance", message: ledgerError.message },
        { status: 500 }
      )
    }

    // Calculate balance
    let balance = 0
    ledgerEntries?.forEach((entry) => {
      if (entry.entry_type === "payout" || entry.entry_type === "adjustment") {
        balance += Number(entry.amount) || 0
      } else if (entry.entry_type === "refund_deduction" || entry.entry_type === "store_purchase") {
        balance -= Math.abs(Number(entry.amount)) || 0
      }
    })

    // Also check vendor's store_balance field (if it exists and is maintained separately)
    const { data: vendorData } = await supabase
      .from("vendors")
      .select("store_balance")
      .eq("vendor_name", vendorName)
      .single()

    // Use the calculated balance from ledger, but also return store_balance if different
    const availableBalance = Math.max(0, balance) // Ensure non-negative

    return NextResponse.json({
      success: true,
      balance: availableBalance,
      storeBalance: vendorData?.store_balance || 0,
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

