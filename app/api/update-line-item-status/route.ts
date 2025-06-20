import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { resequenceEditionNumbers } from "@/lib/resequence-edition-numbers"
import type { Database } from "@/types/supabase"

interface LineItem {
  id: number;
  line_item_id: string;
  order_id: string;
  product_id: string;
  edition_number: number | null;
  edition_total: number | null;
  status: string;
  removed_reason?: string;
  updated_at?: string;
}

export async function POST(request: Request) {
  try {
    const { lineItemId, orderId, status, reason } = await request.json()

    if (!lineItemId || !orderId || !status) {
      return NextResponse.json(
        { error: "Line item ID, order ID, and status are required" },
        { status: 400 }
      )
    }

    // Validate status
    if (status !== "active" && status !== "inactive") {
      return NextResponse.json(
        { error: "Status must be either 'active' or 'inactive'" },
        { status: 400 }
      )
    }

    const cookieStore = cookies()
    const supabase = createClient<Database>({ cookies: () => cookieStore })

    // Get the current item to check if we need to resequence
    const { data: currentItem, error: fetchError } = await supabase
      .from("order_line_items_v2")
      .select("*")
      .eq("line_item_id", lineItemId)
      .eq("order_id", orderId)
      .single()

    if (fetchError) {
      console.error("Error fetching current item:", fetchError)
      return NextResponse.json(
        { error: "Failed to fetch current item" },
        { status: 500 }
      )
    }

    const updateData: Partial<LineItem> = {
      status,
      updated_at: new Date().toISOString(),
    }

    // Add reason if provided
    if (reason) {
      updateData.removed_reason = reason
    }

    // If marking as inactive, set edition_number and edition_total to null
    if (status === "inactive") {
      updateData.edition_number = null
      updateData.edition_total = null
    }

    // Update the line item
    const { data: updatedItem, error: updateError } = await supabase
      .from("order_line_items_v2")
      .update(updateData)
      .eq("line_item_id", lineItemId)
      .eq("order_id", orderId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating line item:", updateError)
      return NextResponse.json(
        { error: "Failed to update line item" },
        { status: 500 }
      )
    }

    // If the item is becoming active, resequence edition numbers
    if (status === "active") {
      const { error: resequenceError } = await resequenceEditionNumbers(supabase, orderId)
      if (resequenceError) {
        console.error("Error resequencing edition numbers:", resequenceError)
        return NextResponse.json(
          { error: "Failed to resequence edition numbers" },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ 
      success: true,
      data: updatedItem
    })
  } catch (error: any) {
    console.error("Error in update-line-item-status:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
