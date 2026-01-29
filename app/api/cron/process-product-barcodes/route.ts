import { NextResponse } from "next/server"
import { updateAllProductsWithBarcodes } from "@/lib/shopify/product-creation"
import { createClient } from "@/lib/supabase/server"

/**
 * Cron job to process product barcodes
 * Runs every 4 hours to ensure all Shopify products have barcodes
 */
export async function GET() {
  const supabase = createClient()

  try {
    console.log("🕐 Starting scheduled product barcode processing...")

    // Process up to 100 products at a time to avoid timeouts
    const result = await updateAllProductsWithBarcodes(100)

    console.log(`✅ Processed ${result.total} products, updated ${result.updated} with barcodes`)

    // Log the cron job execution
    await supabase.from("webhook_logs").insert({
      type: "cron_product_barcodes",
      created_at: new Date().toISOString(),
      details: {
        action: "scheduled_barcode_processing",
        productsProcessed: result.total,
        productsUpdated: result.updated,
        success: true
      }
    })

    return NextResponse.json({
      success: true,
      message: `Processed ${result.total} products, updated ${result.updated} with barcodes`,
      ...result
    })

  } catch (error: any) {
    console.error("❌ Error in product barcode processing:", error)

    // Log the error
    try {
      const supabase = createClient()
      await supabase.from("webhook_logs").insert({
        type: "cron_product_barcodes_error",
        created_at: new Date().toISOString(),
        details: {
          action: "scheduled_barcode_processing",
          error: error.message,
          stack: error.stack,
          success: false
        }
      })
    } catch (logError) {
      console.error("Failed to log cron error:", logError)
    }

    return NextResponse.json(
      { error: "Failed to process product barcodes", message: error.message },
      { status: 500 }
    )
  }
}