import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SHOPIFY_WEBHOOK_SECRET } from "@/lib/env"
import crypto from "crypto"
import { createClient } from "@/lib/supabase/server"
import { syncShopifyOrder } from "@/lib/shopify/order-sync-utils"

/**
 * Shopify Order Webhook Handler
 * This endpoint receives webhook notifications from Shopify when orders are created or updated
 * It processes the orders and updates the edition numbers accordingly
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
    console.log("Received Shopify order webhook:", webhookData.id, "financial_status:", webhookData.financial_status)

    // Sync the entire order to database using shared utility
    await syncOrderToDatabase(webhookData, supabase)

    // Log the webhook event
    try {
      await supabase.from("webhook_logs").insert({
        type: "shopify_order",
        created_at: new Date().toISOString(),
        details: {
          orderId: webhookData.id,
          orderName: webhookData.name,
          orderNumber: webhookData.order_number,
          processedAt: webhookData.processed_at,
          lineItemsCount: webhookData.line_items?.length || 0,
        },
      })
    } catch (logError) {
      console.error("Error logging webhook event:", logError)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error processing Shopify webhook:", error)
    return NextResponse.json({ error: error.message || "Failed to process webhook" }, { status: 500 })
  }
}

/**
 * Sync order to database - syncs ALL orders, not just limited edition
 */
async function syncOrderToDatabase(order: any, supabase: any) {
  try {
    console.log(`[webhook] Syncing order ${order.id} (${order.name}) to database`)
    
    // Use shared utility with warehouse enrichment enabled
    const syncRes = await syncShopifyOrder(supabase, order, { forceWarehouseSync: true })
    
    if (syncRes.success) {
      console.log(`[webhook] Successfully synced order ${order.name} to database. Results: ${syncRes.results?.join(', ')}`)
      
      // Process credit deposits for fulfilled line items
      try {
        const { processOrderFulfillmentCredits } = await import('@/lib/banking/fulfillment-credit-processor')
        await processOrderFulfillmentCredits(order.id.toString(), supabase)
      } catch (creditError) {
        console.error(`[webhook] Error processing fulfillment credits for order ${order.name}:`, creditError)
      }
      
      // Recalculate series completion
      if (order.fulfillment_status === 'fulfilled' || order.financial_status === 'paid') {
        try {
          const productIds = order.line_items
            .map((item: any) => item.product_id?.toString())
            .filter(Boolean)

          if (productIds.length > 0) {
            const { data: seriesMembers } = await supabase
              .from('artwork_series_members')
              .select('series_id')
              .in('shopify_product_id', productIds)

            if (seriesMembers && seriesMembers.length > 0) {
              const uniqueSeriesIds = [...new Set(seriesMembers.map((m: any) => m.series_id))]
              const { checkAndCompleteSeries } = await import('@/lib/series/completion-calculator')
              for (const seriesId of uniqueSeriesIds) {
                await checkAndCompleteSeries(seriesId)
              }
            }
          }
        } catch (completionError) {
          console.error(`[webhook] Error processing series completion:`, completionError)
        }
      }
    } else {
      console.error(`[webhook] Sync failed for order ${order.name}:`, syncRes.error)
    }
  } catch (error) {
    console.error(`[webhook] Error syncing order ${order.name} to database:`, error)
  }
}
