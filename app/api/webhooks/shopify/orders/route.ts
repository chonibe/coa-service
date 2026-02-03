import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SHOPIFY_WEBHOOK_SECRET } from "@/lib/env"
import crypto from "crypto"
import { createClient } from "@/lib/supabase/server"
import { syncShopifyOrder } from "@/lib/shopify/order-sync-utils"
import { sendOrderConfirmationWithTracking } from "@/lib/notifications/order-confirmation"

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

      // Store purchase data for client-side tracking (server-side GA tracking doesn't work)
      if (order.financial_status === 'paid') {
        try {
          const purchaseData = {
            orderId: order.id.toString(),
            orderName: order.name,
            lineItems: order.line_items?.map((item: any) => ({
              id: (item.id ?? '').toString(),
              product_id: (item.product_id ?? '').toString(),
              title: item.title || '',
              variant_title: item.variant_title || '',
              vendor: item.vendor || '',
              product_type: item.product_type || '',
              quantity: item.quantity || 1,
              price: item.price || '0',
              line_price: (parseFloat(item.price || '0') * (item.quantity || 1)).toString()
            })) || [],
            subtotal: parseFloat(order.subtotal_price || '0'),
            shipping: parseFloat(order.total_shipping_price_set?.shop_money?.amount || '0'),
            tax: parseFloat(order.total_tax || '0'),
            currency: order.currency || 'USD',
            processedAt: order.processed_at
          }

          // Store in database for client-side retrieval
          await supabase.from('ga4_purchase_tracking').upsert({
            order_id: order.id.toString(),
            purchase_data: purchaseData,
            tracked_at: null, // Will be set when client-side tracking occurs
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'order_id'
          })

          console.log(`[webhook] Stored purchase data for GA4 client-side tracking: ${order.name}`)
        } catch (gaError) {
          console.error(`[webhook] Error storing GA purchase data for order ${order.name}:`, gaError)
        }

        // Create tracking link and send order confirmation email
        try {
          await createTrackingLinkAndSendConfirmation(order, supabase)
        } catch (trackingError) {
          console.error(`[webhook] Error creating tracking link for order ${order.name}:`, trackingError)
        }
      }

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
                await checkAndCompleteSeries(seriesId as string)
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

/**
 * Create a tracking link for a new order and send confirmation email
 * This is called when a new paid order is received
 */
async function createTrackingLinkAndSendConfirmation(order: any, supabase: any) {
  const customerEmail = order.email || order.customer?.email
  if (!customerEmail) {
    console.log(`[webhook] No customer email for order ${order.name}, skipping confirmation email`)
    return
  }

  // Check if a tracking link already exists for this order
  const orderId = order.id.toString()
  const orderName = order.name

  // Look for existing tracking link by order_ids containing this order name
  const { data: existingLink } = await supabase
    .from('shared_order_tracking_links')
    .select('*')
    .or(`order_ids.cs.{${orderName}},order_ids.cs.{${orderId}}`)
    .maybeSingle()

  if (existingLink) {
    console.log(`[webhook] Tracking link already exists for order ${orderName}: ${existingLink.token}`)
    return
  }

  // Generate a new tracking token
  const token = crypto.randomBytes(32).toString('hex')
  
  // Get customer name
  const customerName = order.customer 
    ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() || 'Customer'
    : order.shipping_address 
      ? `${order.shipping_address.first_name || ''} ${order.shipping_address.last_name || ''}`.trim() || 'Customer'
      : 'Customer'

  // Create the tracking link
  const { data: newLink, error: linkError } = await supabase
    .from('shared_order_tracking_links')
    .insert({
      token,
      order_ids: [orderName], // Use order name (e.g., #1234) for consistency with warehouse orders
      title: `Order ${orderName}`,
      created_by: 'system@shopify-webhook',
      primary_color: '#8217ff',
    })
    .select()
    .single()

  if (linkError) {
    console.error(`[webhook] Error creating tracking link for order ${orderName}:`, linkError)
    return
  }

  console.log(`[webhook] Created tracking link for order ${orderName}: ${token}`)

  // Create notification preferences for this tracking link
  await supabase
    .from('tracking_link_notification_preferences')
    .upsert({
      token,
      email_enabled: true,
      notification_email: customerEmail.toLowerCase(),
      last_notified_status: {},
      updated_at: new Date().toISOString(),
    }, { onConflict: 'token' })

  // Add order confirmation note
  await supabase.from('order_status_notes').insert({
    order_id: orderId,
    order_name: orderName,
    status_name: 'Order Placed',
    note: `Order received and confirmed. Tracking link created.`,
    source: 'webhook',
  })

  // Prepare line items for the email
  const lineItems = order.line_items?.map((item: any) => ({
    name: item.title || item.name || 'Item',
    quantity: item.quantity || 1,
    price: item.price || '0.00',
  })) || []

  // Send the order confirmation email
  const emailResult = await sendOrderConfirmationWithTracking({
    orderName,
    customerName,
    customerEmail: customerEmail.toLowerCase(),
    trackingToken: token,
    lineItems,
    totalPrice: order.total_price,
    currency: order.currency === 'USD' ? '$' : order.currency,
    baseUrl: process.env.NEXT_PUBLIC_APP_URL,
  })

  if (emailResult.success) {
    console.log(`[webhook] Sent order confirmation email for ${orderName} to ${customerEmail}`)
  } else {
    console.error(`[webhook] Failed to send confirmation email for ${orderName}:`, emailResult.error)
  }
}
