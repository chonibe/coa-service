import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { updateAllProductsWithBarcodes } from "@/lib/shopify/product-creation"
import { createClient } from "@/lib/supabase/server"

/**
 * Manual trigger to process barcodes for all Shopify products
 * Useful for one-time bulk processing or testing
 */
export async function POST(request: NextRequest) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  const supabase = createClient()

  try {
    const { limit = 500, force = false } = await request.json()

    console.log(`🛍️ Starting manual barcode processing for up to ${limit} products...`)

    // Process products with specified limit
    const result = await updateAllProductsWithBarcodes(limit)

    console.log(`✅ Manual barcode processing completed: ${result.updated}/${result.total} products updated`)

    // Log the manual processing
    await supabase.from("webhook_logs").insert({
      type: "manual_product_barcodes",
      created_at: new Date().toISOString(),
      details: {
        action: "manual_barcode_processing",
        productsProcessed: result.total,
        productsUpdated: result.updated,
        limit: limit,
        force: force,
        success: true
      }
    })

    return NextResponse.json({
      success: true,
      message: `Processed ${result.total} products, updated ${result.updated} with barcodes`,
      ...result
    })

  } catch (error: any) {
    console.error("❌ Error in manual barcode processing:", error)

    // Log the error
    try {
      const supabase = createClient()
      await supabase.from("webhook_logs").insert({
        type: "manual_product_barcodes_error",
        created_at: new Date().toISOString(),
        details: {
          action: "manual_barcode_processing",
          error: error.message,
          stack: error.stack,
          success: false
        }
      })
    } catch (logError) {
      console.error("Failed to log manual processing error:", logError)
    }

    return NextResponse.json(
      { error: "Failed to process barcodes", message: error.message },
      { status: 500 }
    )
  }
}