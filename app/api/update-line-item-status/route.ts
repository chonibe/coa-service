import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { resequenceEditionNumbers } from "@/lib/resequence-edition-numbers"

const VALID_STATUSES = ["active", "inactive", "removed"] as const;
type LineItemStatus = typeof VALID_STATUSES[number];

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { orderId, lineItemId, status } = await request.json()

    // Validate required fields
    if (!lineItemId || !orderId || !status) {
      return NextResponse.json(
        { error: "Missing required fields: lineItemId, orderId, and status are required" },
        { status: 400 }
      )
    }

    // Validate status value
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      )
    }

    // Convert orderId to string to handle large Shopify IDs
    const orderIdStr = orderId.toString()

    if (!supabase) {
      throw new Error("Failed to initialize Supabase client")
    }

    // Update the line item status
    const { error: updateError } = await supabase
      .from("order_line_items_v2")
      .update({
        status,
        updated_at: new Date().toISOString(),
        removed_reason: status === "removed" ? "Manually removed" : null,
        edition_number: status === "active" ? null : null // Reset edition number if not active
      })
      .eq("id", lineItemId)
      .eq("order_id", orderIdStr)

    if (updateError) {
      console.error("Error updating line item status:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // If status is 'removed', resequence edition numbers
    if (status === "removed") {
      const { error: resequenceError } = await resequenceEditionNumbers(supabase, orderIdStr)
      if (resequenceError) {
        console.error("Error resequencing edition numbers:", resequenceError)
        return NextResponse.json({ error: resequenceError.message }, { status: 500 })
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
