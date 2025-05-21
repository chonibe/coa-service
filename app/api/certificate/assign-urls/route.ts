import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

export async function POST() {
  try {
    const supabase = createClient()
    const baseUrl = process.env.NEXT_PUBLIC_CUSTOMER_APP_URL || process.env.NEXT_PUBLIC_APP_URL || ""

    // Get all active line items
    const { data: activeItems, error: fetchError } = await supabase
      .from("order_line_items_v2")
      .select("*")
      .eq("status", "active")
      .is("certificate_url", null)

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

    // Process each item
    for (const item of activeItems) {
      try {
        const certificateUrl = `${baseUrl}/certificate/${item.line_item_id}`
        const certificateToken = crypto.randomUUID()

        const { error: updateError } = await supabase
          .from("order_line_items_v2")
          .update({
            certificate_url: certificateUrl,
            certificate_token: certificateToken,
            certificate_generated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("line_item_id", item.line_item_id)
          .eq("order_id", item.order_id)

        if (updateError) {
          console.error(`Error updating item ${item.line_item_id}:`, updateError)
          failCount++
          results.push({
            lineItemId: item.line_item_id,
            orderId: item.order_id,
            success: false,
            error: updateError.message
          })
        } else {
          successCount++
          results.push({
            lineItemId: item.line_item_id,
            orderId: item.order_id,
            success: true,
            certificateUrl
          })
        }
      } catch (err) {
        console.error(`Error processing item ${item.line_item_id}:`, err)
        failCount++
        results.push({
          lineItemId: item.line_item_id,
          orderId: item.order_id,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error"
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${activeItems.length} items. Success: ${successCount}, Failed: ${failCount}`,
      results
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