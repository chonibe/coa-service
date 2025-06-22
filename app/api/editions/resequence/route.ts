import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"

interface LineItem {
  id: number;
  line_item_id: string;
  order_id: string;
  product_id: string;
  edition_number: number | null;
  edition_total: number | null;
  certificate_url: string | null;
  certificate_token: string | null;
  certificate_generated_at: string | null;
  created_at: string;
}

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

    // First, ensure all inactive items have null edition numbers
    const { error: removeError } = await supabase
      .from("order_line_items")
      .update({
        edition_number: null,
        edition_total: null,
        updated_at: new Date().toISOString(),
      })
      .eq("product_id", productId)
      .eq("status", "inactive")

    if (removeError) {
      console.error("Error clearing edition numbers for inactive items:", removeError)
      throw new Error("Failed to clear edition numbers for inactive items")
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
        inactiveItemsCount: 0,
      })
    }

    console.log(`Found ${activeItems.length} active items to resequence`)

    // Assign new sequential edition numbers starting from 1
    let editionCounter = 1
    let updatedCount = 0

    for (const item of activeItems as LineItem[]) {
      // Generate certificate URL if it doesn't exist
      const baseUrl = process.env.NEXT_PUBLIC_CUSTOMER_APP_URL || process.env.NEXT_PUBLIC_APP_URL || ""
      const certificateUrl = item.certificate_url || `${baseUrl}/certificate/${item.line_item_id}`
      const certificateToken = item.certificate_token || crypto.randomUUID()
      const now = new Date().toISOString()

      const { error: updateError } = await supabase
        .from("order_line_items")
        .update({
          edition_number: editionCounter,
          edition_total: activeItems.length,
          updated_at: now,
          certificate_url: certificateUrl,
          certificate_token: certificateToken,
          certificate_generated_at: item.certificate_generated_at || now,
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

    // Get count of inactive items
    const { count: inactiveCount, error: countError } = await supabase
      .from("order_line_items")
      .select("*", { count: "exact" })
      .eq("product_id", productId)
      .eq("status", "inactive")

    if (countError) {
      console.error("Error counting inactive items:", countError)
    }

    return NextResponse.json({
      success: true,
      message: `Resequencing complete. Assigned edition numbers 1 through ${editionCounter - 1}`,
      activeItemsCount: activeItems.length,
      updatedCount,
      inactiveItemsCount: inactiveCount || 0,
    })
  } catch (error: any) {
    console.error("Error in manual resequencing:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to resequence edition numbers" },
      { status: 500 },
    )
  }
}
