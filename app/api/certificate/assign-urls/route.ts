import { getSupabaseUrl, getSupabaseKey } from '@/lib/supabase/client-utils'
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

const BATCH_SIZE = 25 // Process 25 items at a time to prevent timeouts

export async function POST() {
  try {
    const supabase = createClient()
    const baseUrl = process.env.NEXT_PUBLIC_CUSTOMER_APP_URL || process.env.NEXT_PUBLIC_APP_URL || ""

    // Get all active line items without certificate URLs
    const { data: activeItems, error: fetchError } = await supabase
      .from("order_line_items_v2")
      .select("*")
      .eq("status", "active")
      .is("certificate_url", null)
      .limit(BATCH_SIZE)

    if (fetchError) {
      throw new Error(`Error fetching line items: ${fetchError.message}`)
    }

    if (!activeItems || activeItems.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "No active items found without certificate URLs" 
      })
    }

    let successCount = 0
    let failCount = 0
    const results = []

    // Process each item in the batch
    for (const item of activeItems) {
      try {
        const certificateUrl = `${baseUrl}/certificate/${item.line_item_id}`
        const certificateToken = crypto.randomUUID()
        const now = new Date().toISOString()

        // Update order_line_items_v2
        const { error: updateError } = await supabase
          .from("order_line_items_v2")
          .update({
            certificate_url: certificateUrl,
            certificate_token: certificateToken,
            certificate_generated_at: now,
            updated_at: now,
          })
          .eq("line_item_id", item.line_item_id)
          .eq("order_id", item.order_id)

        if (updateError) {
          throw new Error(`Error updating order_line_items_v2: ${updateError.message}`)
        }

        // Update product_edition_counters
        const { error: counterUpdateError } = await supabase
          .from("product_edition_counters")
          .update({
            certificate_url: certificateUrl,
            certificate_token: certificateToken,
            certificate_generated_at: now,
            updated_at: now,
          })
          .eq("product_id", item.product_id)
          .eq("edition_number", item.edition_number)

        if (counterUpdateError) {
          console.error(`Error updating product_edition_counters for item ${item.line_item_id}:`, counterUpdateError)
          // Don't fail the whole operation if counter update fails
        }

        successCount++
        results.push({
          lineItemId: item.line_item_id,
          orderId: item.order_id,
          productId: item.product_id,
          editionNumber: item.edition_number,
          success: true,
          certificateUrl
        })

        // Add a small delay between items to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 50))
      } catch (err) {
        console.error(`Error processing item ${item.line_item_id}:`, err)
        failCount++
        results.push({
          lineItemId: item.line_item_id,
          orderId: item.order_id,
          productId: item.product_id,
          editionNumber: item.edition_number,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error"
        })
      }
    }

    // Get total count of remaining items
    const { count: remainingCount } = await supabase
      .from("order_line_items_v2")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .is("certificate_url", null)

    const remainingItems = remainingCount ?? 0

    return NextResponse.json({
      success: true,
      message: `Processed ${activeItems.length} items. Success: ${successCount}, Failed: ${failCount}. ${remainingItems > 0 ? `${remainingItems} items remaining.` : "All items processed."}`,
      results,
      hasMore: remainingItems > 0
    })

  } catch (error) {
    console.error("Error in assign-urls:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
} 