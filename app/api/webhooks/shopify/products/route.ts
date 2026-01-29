import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SHOPIFY_WEBHOOK_SECRET } from "@/lib/env"
import crypto from "crypto"
import { createClient } from "@/lib/supabase/server"
import { updateProductVariantsWithBarcodes } from "@/lib/shopify/product-creation"

/**
 * Shopify Product Webhook Handler
 * This endpoint receives webhook notifications from Shopify when products are created or updated
 * It automatically assigns barcodes to new products and variants
 */
export async function POST(request: NextRequest) {
  const supabase = createClient()

  try {
    // Verify the webhook is from Shopify
    const hmacHeader = request.headers.get("x-shopify-hmac-sha256")

    if (!hmacHeader || !SHOPIFY_WEBHOOK_SECRET) {
      console.error("Missing HMAC header or webhook secret")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the raw request body for HMAC verification
    const rawBody = await request.text()

    // Verify the HMAC signature
    const generatedHash = crypto.createHmac("sha256", SHOPIFY_WEBHOOK_SECRET).update(rawBody, "utf8").digest("base64")

    if (generatedHash !== hmacHeader) {
      console.error("HMAC verification failed")
      return NextResponse.json({ error: "HMAC verification failed" }, { status: 401 })
    }

    // Parse the webhook body
    const webhookData = JSON.parse(rawBody)
    const productId = webhookData.id?.toString()
    const eventType = request.headers.get("x-shopify-topic") || "unknown"

    console.log(`Received Shopify product webhook: ${eventType} for product ${productId}`)

    // Process any product-related webhook event to ensure barcodes
    console.log(`Processing ${eventType} for product ${productId}`)

    try {
      // Always check and update barcodes for any product event
      // This ensures barcodes are added to new products, existing products without barcodes, and updated products
      await updateProductVariantsWithBarcodes(productId)

      console.log(`✅ Barcodes processed for product ${productId} (${eventType})`)

      // Log successful barcode processing
      await supabase.from("webhook_logs").insert({
        type: "shopify_product_barcode",
        created_at: new Date().toISOString(),
        details: {
          productId: productId,
          event: eventType,
          action: "barcodes_processed",
          success: true
        }
      })

    } catch (barcodeError: any) {
      console.error(`❌ Failed to process barcodes for product ${productId}:`, barcodeError.message)

      // Log failed barcode processing
      await supabase.from("webhook_logs").insert({
        type: "shopify_product_barcode",
        created_at: new Date().toISOString(),
        details: {
          productId: productId,
          event: eventType,
          action: "barcode_processing_failed",
          error: barcodeError.message,
          success: false
        }
      })

      // Don't fail the webhook - the product event was successful, barcode processing is secondary
    }

    // Log the webhook event
    try {
      await supabase.from("webhook_logs").insert({
        type: "shopify_product",
        created_at: new Date().toISOString(),
        details: {
          productId: productId,
          event: eventType,
          productTitle: webhookData.title,
          variantCount: webhookData.variants?.length || 0
        }
      })
    } catch (logError) {
      console.error("Failed to log webhook event:", logError)
      // Don't fail the webhook if logging fails
    }

    // Always return success to Shopify
    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("Error processing Shopify product webhook:", error)

    // Log the error
    try {
      const supabase = createClient()
      await supabase.from("webhook_logs").insert({
        type: "shopify_product_error",
        created_at: new Date().toISOString(),
        details: {
          error: error.message,
          stack: error.stack
        }
      })
    } catch (logError) {
      console.error("Failed to log webhook error:", logError)
    }

    // Return success to prevent Shopify from retrying with the same error
    return NextResponse.json({ success: true })
  }
}