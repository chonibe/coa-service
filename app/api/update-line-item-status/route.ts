import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { resequenceEditionNumbers } from "@/lib/resequence-edition-numbers"

const VALID_STATUSES = ["active", "inactive"] as const;
type Status = typeof VALID_STATUSES[number];

export async function POST(request: Request) {
  try {
    const { lineItemId, orderId, status } = await request.json()

    if (!lineItemId || !orderId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (!VALID_STATUSES.includes(status as Status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      )
    }

    const cookieStore = cookies()
    const supabase = createClient()

    // Update the status in the database
    const { error: updateError } = await supabase
      .from("order_line_items_v2")
      .update({ 
        status,
        // Reset edition number if becoming inactive
        edition_number: status === 'inactive' ? null : undefined
      })
      .eq("line_item_id", lineItemId)
      .eq("order_id", orderId)

    if (updateError) {
      console.error("Error updating line item status:", updateError)
      return NextResponse.json(
        { error: "Failed to update line item status" },
        { status: 500 }
      )
    }

    // If the item is becoming active, resequence edition numbers
    if (status === 'active') {
      const { error: resequenceError } = await resequenceEditionNumbers(supabase, orderId)
      if (resequenceError) {
        console.error("Error resequencing edition numbers:", resequenceError)
        return NextResponse.json(
          { error: "Failed to resequence edition numbers" },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in update-line-item-status:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
