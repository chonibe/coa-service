import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"
import { getPayPalPayoutStatus } from "@/lib/paypal/payouts"
import { recordPayoutWithdrawal } from "@/lib/banking/payout-withdrawal"
import { reversePayoutWithdrawal } from "@/lib/banking/payout-reversal"
import { invalidateVendorBalanceCache } from "@/lib/vendor-balance-calculator"

export async function GET(request: NextRequest) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  const supabase = createClient()
  const searchParams = request.nextUrl.searchParams
  const batchId = searchParams.get("batchId")
  const payoutId = searchParams.get("payoutId")

  if (!batchId || !payoutId) {
    return NextResponse.json(
      { error: "batchId and payoutId are required" },
      { status: 400 }
    )
  }

  const numericPayoutId = parseInt(payoutId)

  try {
    // Fetch the payout record to get vendor_name and amount
    const { data: payout, error: payoutError } = await supabase
      .from("vendor_payouts")
      .select("id, vendor_name, amount, status")
      .eq("id", numericPayoutId)
      .single()

    if (payoutError || !payout) {
      return NextResponse.json(
        { error: "Payout not found" },
        { status: 404 }
      )
    }

    const previousStatus = payout.status

    // Check PayPal status
    const paypalStatus = await getPayPalPayoutStatus(batchId)

    // Map PayPal status to our status
    let newStatus = "processing"
    if (paypalStatus.batch_header.batch_status === "SUCCESS") {
      newStatus = "completed"
    } else if (paypalStatus.batch_header.batch_status === "DENIED" || paypalStatus.batch_header.batch_status === "CANCELED") {
      newStatus = "failed"
    } else if (paypalStatus.batch_header.batch_status === "PENDING") {
      newStatus = "pending"
    } else if (paypalStatus.batch_header.batch_status === "PROCESSING") {
      newStatus = "processing"
    }

    // Update payout status in database
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }

    if (paypalStatus.batch_header.time_completed && newStatus === "completed") {
      updateData.payout_date = paypalStatus.batch_header.time_completed
    }

    const { error } = await supabase
      .from("vendor_payouts")
      .update(updateData)
      .eq("id", numericPayoutId)

    if (error) {
      console.error("Error updating payout status:", error)
      return NextResponse.json(
        { error: "Failed to update payout status" },
        { status: 500 }
      )
    }

    // Handle status transitions for ledger entries
    if (newStatus === "completed" && previousStatus !== "completed") {
      // Record withdrawal (duplicate protection built in)
      const withdrawalResult = await recordPayoutWithdrawal(
        payout.vendor_name,
        numericPayoutId,
        parseFloat(payout.amount.toString()),
        supabase
      )
      if (!withdrawalResult.success) {
        console.error(`Failed to record withdrawal for payout ${numericPayoutId}:`, withdrawalResult.error)
      }
      invalidateVendorBalanceCache(payout.vendor_name)
    } else if (newStatus === "failed" && previousStatus !== "failed") {
      // Reverse the withdrawal (idempotent)
      const reversalResult = await reversePayoutWithdrawal(
        payout.vendor_name,
        numericPayoutId,
        parseFloat(payout.amount.toString()),
        supabase
      )
      if (!reversalResult.success) {
        console.error(`Failed to reverse withdrawal for payout ${numericPayoutId}:`, reversalResult.error)
      }
      invalidateVendorBalanceCache(payout.vendor_name)
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      paypalStatus: paypalStatus.batch_header.batch_status,
      message: `Payout status updated to ${newStatus}`,
    })
  } catch (error: any) {
    console.error("Error checking PayPal status:", error)
    return NextResponse.json(
      { error: error.message || "Failed to check PayPal status" },
      { status: 500 }
    )
  }
}

