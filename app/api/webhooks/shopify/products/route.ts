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

    // Only process product creation events
    if (eventType === "products/create") {
      console.log(`Processing new product creation: ${productId}`)

      try {
        // Automatically assign barcodes to the new product
        await updateProductVariantsWithBarcodes(productId)

        console.log(`✅ Successfully assigned barcodes to new product ${productId}`)

        // Log successful barcode assignment
        await supabase.from("webhook_logs").insert({
          type: "shopify_product_barcode",
          created_at: new Date().toISOString(),
          details: {
            productId: productId,
            event: "products/create",
            action: "barcode_assigned",
            success: true
          }
        })

      } catch (barcodeError: any) {
        console.error(`❌ Failed to assign barcodes to product ${productId}:`, barcodeError.message)

        // Log failed barcode assignment
        await supabase.from("webhook_logs").insert({
          type: "shopify_product_barcode",
          created_at: new Date().toISOString(),
          details: {
            productId: productId,
            event: "products/create",
            action: "barcode_assignment_failed",
            error: barcodeError.message,
            success: false
          }
        })

        // Don't fail the webhook - product was created successfully, just barcode assignment failed
      }
    } else if (eventType === "products/update") {
      // For updates, check if any variants are missing barcodes and add them
      console.log(`Processing product update: ${productId}`)

      try {
        await updateProductVariantsWithBarcodes(productId)
        console.log(`✅ Updated barcodes for product ${productId}`)
      } catch (error: any) {
        console.error(`Failed to update barcodes for product ${productId}:`, error.message)
        // Don't fail the webhook for updates
      }
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