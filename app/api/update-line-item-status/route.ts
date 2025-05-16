import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { updateLineItemStatus } from "@/lib/update-line-item-status"
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lineItemId, orderId, status, reason } = body

    if (!lineItemId || !orderId || !status) {
      return NextResponse.json(
        { success: false, message: "Line item ID, order ID, and status are required" },
        { status: 400 },
      )
    }

    // Validate status
    if (status !== "active" && status !== "removed") {
      return NextResponse.json(
        { success: false, message: "Status must be either 'active' or 'removed'" },
        { status: 400 },
      )
    }

    // Start a transaction
    const { data: lineItem, error: fetchError } = await supabase
      .from('line_items')
      .select('*')
      .eq('id', lineItemId)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch line item' },
        { status: 500 }
      )
    }

    // Update the status
    const { error: updateError } = await supabase
      .from('line_items')
      .update({ status })
      .eq('id', lineItemId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update status' },
        { status: 500 }
      )
    }

    // If status is being changed to 'removed', resequence the remaining editions
    if (status === 'removed') {
      const { data: remainingItems, error: remainingError } = await supabase
        .from('line_items')
        .select('*')
        .eq('order_id', orderId)
        .eq('status', 'active')
        .order('edition_number', { ascending: true })

      if (remainingError) {
        return NextResponse.json(
          { error: 'Failed to fetch remaining items' },
          { status: 500 }
        )
      }

      // Update edition numbers for remaining items
      for (let i = 0; i < remainingItems.length; i++) {
        const { error: resequenceError } = await supabase
          .from('line_items')
          .update({ edition_number: i + 1 })
          .eq('id', remainingItems[i].id)

        if (resequenceError) {
          return NextResponse.json(
            { error: 'Failed to resequence editions' },
            { status: 500 }
          )
        }
      }
    }

    // Update the line item status
    const result = await updateLineItemStatus(lineItemId, orderId, status, reason)

    return NextResponse.json({
      success: true,
      message: `Line item status updated to ${status}`,
      updatedAt: result.updatedAt,
    })
  } catch (error: any) {
    console.error("Error updating line item status:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update line item status" },
      { status: 500 },
    )
  }
}
