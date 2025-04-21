import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lineItemId, orderId, payoutAmount, payoutType } = body

    if (!lineItemId || !orderId || !payoutAmount || !payoutType) {
      return NextResponse.json(
        { success: false, message: "Line item ID, order ID, payout amount, and payout type are required" },
        { status: 400 },
      )
    }

    // Validate payout type
    if (payoutType !== "percentage" && payoutType !== "fixed") {
      return NextResponse.json(
        { success: false, message: "Payout type must be either 'percentage' or 'fixed'" },
        { status: 400 },
      )
    }

    // Update the line item with the payout information
    const { error } = await supabase
      .from("order_line_items")
      .update({
        payout_amount: payoutAmount,
        payout_type: payoutType,
      })
      .eq("line_item_id", lineItemId)
      .eq("order_id", orderId)

    if (error) {
      console.error("Error updating line item payout:", error)
      return NextResponse.json({ success: false, message: "Failed to update line item payout" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Payout information updated for line item ${lineItemId}`,
    })
  } catch (error: any) {
    console.error("Error in payout configuration API:", error)
    return NextResponse.json({ success: false, message: error.message || "An error occurred" }, { status: 500 })
  }
}
