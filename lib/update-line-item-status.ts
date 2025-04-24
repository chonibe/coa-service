import { supabase } from "@/lib/supabase"
import crypto from "crypto"

/**
 * Updates the status of a line item and sets the updated_at timestamp
 */
export async function updateLineItemStatus(
  lineItemId: string,
  orderId: string,
  status: "active" | "removed",
  reason?: string,
) {
  try {
    const now = new Date()
    console.log(`Updating line item ${lineItemId} in order ${orderId} to status: ${status} at ${now.toISOString()}`)

    // Prepare the update data
    const updateData: any = {
      status,
      updated_at: now.toISOString(),
    }

    // Add reason if provided
    if (reason) {
      updateData.removed_reason = reason
    }

    // If marking as removed, set edition_number to null
    if (status === "removed") {
      updateData.edition_number = null
    }

    console.log("Update data:", updateData)

    // Update the line item
    const { error, data } = await supabase
      .from("order_line_items")
      .update(updateData)
      .eq("line_item_id", lineItemId)
      .eq("order_id", orderId)

    if (error) {
      console.error("Error updating line item status:", error)
      throw error
    }

    console.log("Update successful, affected rows:", data?.length || 0)

    // If we're marking an item as removed, we need to resequence the edition numbers
    if (status === "removed") {
      // Get the product ID for this line item
      const { data: lineItemData, error: lineItemError } = await supabase
        .from("order_line_items")
        .select("product_id")
        .eq("line_item_id", lineItemId)
        .eq("order_id", orderId)
        .single()

      if (lineItemError) {
        console.error("Error fetching product ID for resequencing:", lineItemError)
      } else if (lineItemData && lineItemData.product_id) {
        // Resequence edition numbers for this product
        await resequenceEditionNumbers(lineItemData.product_id)
      }
    }

    return { success: true, updatedAt: now.toISOString() }
  } catch (error) {
    console.error("Error in updateLineItemStatus:", error)
    throw error
  }
}

/**
 * Resequences edition numbers for a product after items have been removed
 */
async function resequenceEditionNumbers(productId: string) {
  try {
    console.log(`Resequencing edition numbers for product ${productId}`)

    // Get all active line items for this product, ordered by creation date
    const { data: activeItems, error } = await supabase
      .from("order_line_items")
      .select("*")
      .eq("product_id", productId)
      .eq("status", "active") // Only select active items, explicitly exclude removed items
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching active items for resequencing:", error)
      return
    }

    if (!activeItems || activeItems.length === 0) {
      console.log("No active items found for resequencing")
      return
    }

    console.log(`Found ${activeItems.length} active items to resequence`)

    // Assign new sequential edition numbers starting from 1
    let editionCounter = 1

    for (const item of activeItems) {
      // Generate certificate URL if it doesn't exist
      const baseUrl = process.env.NEXT_PUBLIC_CUSTOMER_APP_URL || process.env.NEXT_PUBLIC_APP_URL || ""
      const certificateUrl = `${baseUrl}/certificate/${item.line_item_id}`
      const certificateToken = crypto.randomUUID()

      const { error: updateError } = await supabase
        .from("order_line_items")
        .update({
          edition_number: editionCounter,
          updated_at: new Date().toISOString(),
          // Only set certificate fields if they don't exist yet
          certificate_url: item.certificate_url || certificateUrl,
          certificate_token: item.certificate_token || certificateToken,
        })
        .eq("line_item_id", item.line_item_id)
        .eq("order_id", item.order_id)

      if (updateError) {
        console.error(`Error updating edition number for item ${item.line_item_id}:`, updateError)
      } else {
        console.log(`Updated item ${item.line_item_id} with new edition number ${editionCounter}`)
        editionCounter++
      }
    }

    console.log(`Resequencing complete. Assigned edition numbers 1 through ${editionCounter - 1}`)
  } catch (error) {
    console.error("Error in resequenceEditionNumbers:", error)
  }
}
