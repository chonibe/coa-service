import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * This endpoint manually resequences edition numbers for a product
 * It will set all active items to sequential numbers starting from 1
 * and ensure removed items have null edition numbers
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get("productId")

  if (!productId) {
    return NextResponse.json({ success: false, message: "Product ID is required" }, { status: 400 })
  }

  try {
    console.log(`Manual resequencing for product ${productId}`)

    // First, ensure all removed items have null edition numbers
    const { error: removeError } = await supabase
      .from("order_line_items")
      .update({
        edition_number: null,
        updated_at: new Date().toISOString(),
      })
      .eq("product_id", productId)
      .eq("status", "removed")

    if (removeError) {
      console.error("Error clearing edition numbers for removed items:", removeError)
      throw new Error("Failed to clear edition numbers for removed items")
    }

    // Get all active line items for this product, ordered by creation date
    const { data: activeItems, error } = await supabase
      .from("order_line_items")
      .select("*")
      .eq("product_id", productId)
      .eq("status", "active")
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching active items for resequencing:", error)
      throw new Error("Failed to fetch active items for resequencing")
    }

    if (!activeItems || activeItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active items found for resequencing",
        activeItemsCount: 0,
        removedItemsCount: 0,
      })
    }

    console.log(`Found ${activeItems.length} active items to resequence`)

    // Assign new sequential edition numbers starting from 1
    let editionCounter = 1
    let updatedCount = 0

    for (const item of activeItems) {
      const { error: updateError } = await supabase
        .from("order_line_items")
        .update({
          edition_number: editionCounter,
          updated_at: new Date().toISOString(),
        })
        .eq("line_item_id", item.line_item_id)
        .eq("order_id", item.order_id)

      if (updateError) {
        console.error(`Error updating edition number for item ${item.line_item_id}:`, updateError)
      } else {
        updatedCount++
        editionCounter++
      }
    }

    // Get count of removed items
    const { count: removedCount, error: countError } = await supabase
      .from("order_line_items")
      .select("*", { count: "exact" })
      .eq("product_id", productId)
      .eq("status", "removed")

    if (countError) {
      console.error("Error counting removed items:", countError)
    }

    return NextResponse.json({
      success: true,
      message: `Resequencing complete. Assigned edition numbers 1 through ${editionCounter - 1}`,
      activeItemsCount: activeItems.length,
      updatedCount,
      removedItemsCount: removedCount || 0,
    })
  } catch (error: any) {
    console.error("Error in manual resequencing:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to resequence edition numbers" },
      { status: 500 },
    )
  }
}
