import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { resequenceEditionNumbers } from "@/lib/resequence-edition-numbers"

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { orderId, lineItemId, status } = await request.json()

    // Convert orderId to string to handle large Shopify IDs
    const orderIdStr = orderId.toString()

    if (!supabase) {
      throw new Error("Failed to initialize Supabase client")
    }

    if (!lineItemId || !orderId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
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
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
