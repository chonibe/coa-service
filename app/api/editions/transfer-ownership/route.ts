import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const TransferOwnershipSchema = z.object({
  line_item_id: z.string().min(1),
  order_id: z.string().min(1),
  to_owner_name: z.string().optional(),
  to_owner_email: z.string().email().optional(),
  to_owner_id: z.string().optional(),
  reason: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const supabase = createClient()

  try {
    const body = await request.json()
    const validationResult = TransferOwnershipSchema.safeParse(body)

    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(err => err.message).join(", ")
      return NextResponse.json(
        { success: false, message: `Validation failed: ${errorMessages}` },
        { status: 400 }
      )
    }

    const { line_item_id, order_id, to_owner_name, to_owner_email, to_owner_id, reason } = validationResult.data

    // Get current line item to validate ownership and get current owner info
    const { data: currentItem, error: fetchError } = await supabase
      .from("order_line_items_v2")
      .select("line_item_id, order_id, edition_number, owner_name, owner_email, owner_id, product_id, status")
      .eq("line_item_id", line_item_id)
      .eq("order_id", order_id)
      .single()

    if (fetchError || !currentItem) {
      return NextResponse.json(
        { success: false, message: "Line item not found" },
        { status: 404 }
      )
    }

    // Validate that edition number exists
    if (!currentItem.edition_number) {
      return NextResponse.json(
        { success: false, message: "Cannot transfer ownership: edition number not assigned" },
        { status: 400 }
      )
    }

    // Validate that item is active
    if (currentItem.status !== 'active') {
      return NextResponse.json(
        { success: false, message: "Cannot transfer ownership: item is not active" },
        { status: 400 }
      )
    }

    // Check if ownership is actually changing
    const ownershipChanging = 
      (to_owner_name !== undefined && to_owner_name !== currentItem.owner_name) ||
      (to_owner_email !== undefined && to_owner_email !== currentItem.owner_email) ||
      (to_owner_id !== undefined && to_owner_id !== currentItem.owner_id)

    if (!ownershipChanging) {
      return NextResponse.json(
        { success: false, message: "No ownership change detected" },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: {
      owner_name?: string | null;
      owner_email?: string | null;
      owner_id?: string | null;
      updated_at: string;
    } = {
      updated_at: new Date().toISOString(),
    }

    // Only update fields that are provided
    if (to_owner_name !== undefined) {
      updateData.owner_name = to_owner_name || null
    }
    if (to_owner_email !== undefined) {
      updateData.owner_email = to_owner_email || null
    }
    if (to_owner_id !== undefined) {
      updateData.owner_id = to_owner_id || null
    }

    // Update the line item
    // The trigger will automatically log the ownership_transfer event
    const { error: updateError } = await supabase
      .from("order_line_items_v2")
      .update(updateData)
      .eq("line_item_id", line_item_id)
      .eq("order_id", order_id)

    if (updateError) {
      console.error("Error transferring ownership:", updateError)
      return NextResponse.json(
        { success: false, message: "Failed to transfer ownership" },
        { status: 500 }
      )
    }

    // Get the updated item to return
    const { data: updatedItem } = await supabase
      .from("order_line_items_v2")
      .select("line_item_id, order_id, edition_number, owner_name, owner_email, owner_id")
      .eq("line_item_id", line_item_id)
      .eq("order_id", order_id)
      .single()

    return NextResponse.json({
      success: true,
      message: "Ownership transferred successfully",
      data: {
        line_item_id: updatedItem?.line_item_id,
        edition_number: updatedItem?.edition_number,
        previous_owner: {
          name: currentItem.owner_name,
          email: currentItem.owner_email,
          id: currentItem.owner_id,
        },
        new_owner: {
          name: updatedItem?.owner_name,
          email: updatedItem?.owner_email,
          id: updatedItem?.owner_id,
        },
        reason,
      },
    })
  } catch (error: any) {
    console.error("Error in transfer ownership:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

