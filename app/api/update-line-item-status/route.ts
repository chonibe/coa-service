import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

const VALID_STATUSES = ["active", "inactive", "removed"] as const;
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

    // Get the current item to check its status
    const { data: currentItem, error: fetchError } = await supabase
      .from("order_line_items_v2")
      .select("status, product_id")
      .eq("line_item_id", lineItemId)
      .eq("order_id", orderId)
      .single()

    if (fetchError) {
      console.error("Error fetching current item:", fetchError)
      return NextResponse.json(
        { error: "Failed to fetch current item status" },
        { status: 500 }
      )
    }

    // Update the status in the database
    const { error: updateError, data: updatedItem } = await supabase
      .from("order_line_items_v2")
      .update({ 
        status,
        // Reset edition number if becoming inactive
        edition_number: status === 'inactive' ? null : undefined,
        updated_at: new Date().toISOString()
      })
      .eq("line_item_id", lineItemId)
      .eq("order_id", orderId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating line item status:", updateError)
      return NextResponse.json(
        { error: "Failed to update line item status" },
        { status: 500 }
      )
    }

    // ALWAYS re-assign edition numbers globally for the product when status changes
    // to ensure no gaps or duplicates in the sequence.
    if (currentItem.product_id) {
      const { error: rpcError } = await supabase.rpc('assign_edition_numbers', { 
        p_product_id: currentItem.product_id.toString()
      });
      
      if (rpcError) {
        console.error("Error re-assigning editions via RPC:", rpcError);
        // We still continue as the status was updated
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
