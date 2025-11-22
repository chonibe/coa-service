import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"
import { notifyRefundDeduction } from "@/lib/notifications/payout-notifications"

/**
 * API endpoint to mark order line items as refunded
 * This automatically triggers deduction from vendor's next payout
 */
export async function POST(request: NextRequest) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  const supabase = createClient()

  try {
    const body = await request.json()
    const { line_item_id, refund_status, refunded_amount, order_id } = body

    if (!line_item_id || !refund_status) {
      return NextResponse.json(
        { error: "line_item_id and refund_status are required" },
        { status: 400 }
      )
    }

    if (!["partial", "full"].includes(refund_status)) {
      return NextResponse.json(
        { error: "refund_status must be 'partial' or 'full'" },
        { status: 400 }
      )
    }

    // Get the line item to verify it exists and get vendor info
    const { data: lineItem, error: lineItemError } = await supabase
      .from("order_line_items_v2")
      .select("*")
      .eq("line_item_id", line_item_id)
      .single()

    if (lineItemError || !lineItem) {
      return NextResponse.json(
        { error: "Line item not found" },
        { status: 404 }
      )
    }

    // Check if this item was already paid (needs to be paid to deduct)
    const { data: payoutItems } = await supabase
      .from("vendor_payout_items")
      .select("payout_id, amount")
      .eq("line_item_id", line_item_id)
      .not("payout_id", "is", null)
      .limit(1)

    const wasPaid = payoutItems && payoutItems.length > 0
    const paidAmount = payoutItems?.[0]?.amount || 0

    // Update the line item with refund information
    const updateData: any = {
      refund_status,
      refunded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (refund_status === "partial" && refunded_amount !== undefined) {
      updateData.refunded_amount = refunded_amount
    } else if (refund_status === "full") {
      // For full refund, set refunded_amount to the full price
      updateData.refunded_amount = lineItem.price || 0
    }

    const { error: updateError } = await supabase
      .from("order_line_items_v2")
      .update(updateData)
      .eq("line_item_id", line_item_id)

    if (updateError) {
      console.error("Error updating line item refund status:", updateError)
      return NextResponse.json(
        { error: "Failed to update refund status" },
        { status: 500 }
      )
    }

    // If the item was previously paid, create a ledger entry for the deduction
    if (wasPaid && paidAmount > 0) {
      const deductionAmount =
        refund_status === "full"
          ? paidAmount
          : (refunded_amount || 0) * (paidAmount / (lineItem.price || 1))

      // Create ledger entry for refund deduction
      const { error: ledgerError } = await supabase
        .from("vendor_ledger_entries")
        .insert({
          vendor_name: lineItem.vendor_name,
          line_item_id: line_item_id,
          order_id: order_id || lineItem.order_id,
          amount: -Math.abs(deductionAmount), // Negative amount for deduction
          entry_type: "refund_deduction",
          payout_id: payoutItems[0].payout_id,
          description: `Refund deduction for ${refund_status} refund of line item ${line_item_id}`,
          created_by: auth.user?.email || "system",
          metadata: {
            refund_status,
            refunded_amount: updateData.refunded_amount,
            original_payout_amount: paidAmount,
          },
        })

      if (ledgerError) {
        console.error("Error creating ledger entry:", ledgerError)
        // Don't fail the request, but log the error
      } else {
        // Get current vendor balance
        const { data: balanceData } = await supabase
          .from("vendor_ledger_entries")
          .select("amount")
          .eq("vendor_name", lineItem.vendor_name)

        const currentBalance = balanceData?.reduce((sum, entry) => sum + parseFloat(entry.amount.toString()), 0) || 0

        // Get order name for notification
        const { data: order } = await supabase
          .from("orders")
          .select("name")
          .eq("id", order_id || lineItem.order_id)
          .single()

        // Send refund deduction notification
        await notifyRefundDeduction(lineItem.vendor_name, {
          vendorName: lineItem.vendor_name,
          refundAmount: refunded_amount || lineItem.price || 0,
          currency: "USD",
          orderId: order_id || lineItem.order_id || "",
          orderName: order?.name,
          refundType: refund_status as "full" | "partial",
          deductionAmount: deductionAmount,
          newBalance: currentBalance,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Line item marked as ${refund_status} refund`,
      was_paid: wasPaid,
      deduction_amount: wasPaid
        ? refund_status === "full"
          ? paidAmount
          : (refunded_amount || 0) * (paidAmount / (lineItem.price || 1))
        : 0,
    })
  } catch (error: any) {
    console.error("Error processing refund:", error)
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

