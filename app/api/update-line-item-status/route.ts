import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { resequenceEditionNumbers } from "@/lib/resequence-edition-numbers"

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    if (!supabase) {
      throw new Error("Failed to initialize Supabase client")
    }

    const { lineItemId, orderId, status } = await request.json()

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

    if (updateError) {
      throw updateError
    }

    // Get the product ID for resequencing
    const { data: lineItem, error: fetchError } = await supabase
      .from("order_line_items_v2")
      .select("product_id")
      .eq("id", lineItemId)
      .single()

    if (fetchError) {
      throw fetchError
    }

    if (lineItem?.product_id) {
      // Resequence edition numbers for the product
      await resequenceEditionNumbers(lineItem.product_id)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error updating line item status:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update line item status" },
      { status: 500 }
    )
  }
}
