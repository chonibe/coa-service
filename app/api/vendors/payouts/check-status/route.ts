import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"
import { getPayPalPayoutStatus } from "@/lib/paypal/payouts"

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

  try {
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
      .eq("id", parseInt(payoutId))

    if (error) {
      console.error("Error updating payout status:", error)
      return NextResponse.json(
        { error: "Failed to update payout status" },
        { status: 500 }
      )
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

