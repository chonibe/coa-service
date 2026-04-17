import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { MINIMUM_PAYOUT_AMOUNT, DEFAULT_PAYOUT_PERCENTAGE } from "@/lib/payout-calculator"

// Processing window (business days, admin-defined).
// Change here if admin SLA changes; see docs/features/vendor-payouts/README.md.
const PROCESSING_WINDOW_DAYS: [number, number] = [1, 3]

/**
 * GET /api/vendor/payouts/config
 *
 * Single source of truth for payout UX constants consumed by the client.
 * Prevents drift between lib/payout-calculator.ts and hard-coded client values.
 */
export async function GET() {
  const cookieStore = cookies()
  const vendorName = getVendorFromCookieStore(cookieStore)

  if (!vendorName) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  return NextResponse.json({
    minimumPayoutAmount: MINIMUM_PAYOUT_AMOUNT,
    defaultPayoutPercentage: DEFAULT_PAYOUT_PERCENTAGE,
    currency: "USD",
    processingWindowDays: PROCESSING_WINDOW_DAYS,
    paymentProvider: "paypal",
  })
}
