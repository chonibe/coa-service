import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  const supabase = createClient()
  
  try {
    // Verify the request is from an authenticated admin
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch all orders from Shopify
    const orders = await fetchOrdersFromShopify()
    console.log(`Fetched ${orders.length} orders from Shopify`)

    // Process each order - sync ALL orders to database, not just limited edition
    let processedCount = 0
    let skippedCount = 0
    let lastProcessedOrder = null
    let syncedOrders = 0
    let syncedLineItems = 0
    let errors = 0
    const productIdsToResequence = new Set<string>()

    for (const order of orders) {
      try {
        // First, upsert the order to the orders table
        const orderData: any = {
          id: order.id.toString(),
          order_number: order.name.replace('#', ''),
          financial_status: order.financial_status,
          fulfillment_status: order.fulfillment_status || 'pending',
          total_price: parseFloat(order.current_total_price || order.total_price || '0'),
          currency_code: order.currency || 'USD',
          customer_email: order.email || null,
          updated_at: new Date().toISOString(),
          raw_shopify_order_data: order,
        }

        // Use processed_at if available, otherwise use created_at
        if (order.processed_at) {
          orderData.processed_at = order.processed_at
        } else if (order.created_at) {
          orderData.processed_at = order.created_at
        } else {
          orderData.processed_at = new Date().toISOString()
        }

        // Use created_at if available
        if (order.created_at) {
          orderData.created_at = order.created_at
        } else {
          orderData.created_at = orderData.processed_at
        }

        const { error: orderError } = await supabase
          .from('orders')
          .upsert(orderData, { onConflict: 'id' })

        if (orderError) {
          console.error(`Error upserting order ${order.name}:`, orderError)
          errors++
          skippedCount++
          continue
        }

        syncedOrders++
        processedCount++
        lastProcessedOrder = order

        // Now sync line items to order_line_items_v2
        if (order.line_items && order.line_items.length > 0) {
          // Check for restocked items from refund data
          const restockedLineItemIds = new Set<number>()
          if (order.refunds && Array.isArray(order.refunds)) {
            order.refunds.forEach((refund: any) => {
              if (refund.refund_line_items && Array.isArray(refund.refund_line_items)) {
                refund.refund_line_items.forEach((refundItem: any) => {
                  if (refundItem.restock === true) {
                    restockedLineItemIds.add(refundItem.line_item_id)
                  }
                })
              }
            })
          }

          // Delete existing line items for this order
          await supabase
            .from('order_line_items_v2')
            .delete()
            .eq('order_id', order.id.toString())

          // Insert new line items
          const lineItems = order.line_items.map((item: any) => {
            const isRestocked = restockedLineItemIds.has(item.id)
            const isCancelled = order.financial_status === 'voided'
            const isFulfilled = item.fulfillment_status === 'fulfilled'
            const isOrderPaid = ['paid', 'authorized', 'pending', 'partially_paid'].includes(order.financial_status)
            
            // Determine status:
            // - inactive if restocked or cancelled
            // - active if order is paid/in-progress (even if not fulfilled yet)
            // - active if fulfilled
            const status = (isRestocked || isCancelled) ? 'inactive' : (isOrderPaid || isFulfilled ? 'active' : 'inactive')
            
            // Edition numbers will be assigned by assign_edition_numbers function for all active items
            // Set to undefined so it gets assigned, or null if restocked/cancelled
            const shouldClearEdition = isRestocked || isCancelled
            
            return {
              order_id: order.id.toString(),
              order_name: order.name,
              line_item_id: item.id.toString(),
              product_id: item.product_id?.toString() || '',
              variant_id: item.variant_id?.toString() || null,
              name: item.title,
              description: item.title,
              quantity: item.quantity || 1,
              price: parseFloat(item.price || '0'),
              sku: item.sku || null,
              vendor_name: item.vendor || null,
              fulfillment_status: item.fulfillment_status || null,
              restocked: isRestocked,
              status: status,
              edition_number: shouldClearEdition ? null : undefined, // Will be assigned by assign_edition_numbers for active items
              edition_total: shouldClearEdition ? null : undefined, // Will be set by assign_edition_numbers
              created_at: orderData.created_at,
              updated_at: new Date().toISOString(),
            }
          })

          const { error: lineItemsError } = await supabase
            .from('order_line_items_v2')
            .insert(lineItems)

          if (lineItemsError) {
            console.error(`Error inserting line items for order ${order.name}:`, lineItemsError)
            errors++
          } else {
            syncedLineItems += lineItems.length
            
            // Collect product IDs for edition number assignment
            lineItems.forEach((item: any) => {
              if (item.status === 'active' && item.product_id) {
                productIdsToResequence.add(item.product_id)
              }
              if (item.restocked && item.product_id) {
                productIdsToResequence.add(item.product_id)
              }
            })
          }
        }

        // Also process limited edition items for the old system (if needed)
        const result = await processShopifyOrder(order)
        if (!result.processed) {
          // Order was synced but doesn't have limited edition items - that's fine
        }
      } catch (error) {
        console.error(`Error processing order ${order.name}:`, error)
        errors++
        skippedCount++
      }
    }

    // Assign edition numbers for all products with active items
    let editionAssignmentErrors = 0
    let editionAssignments = 0
    
    if (productIdsToResequence.size > 0) {
      console.log(`Assigning edition numbers for ${productIdsToResequence.size} products...`)
      
      for (const productId of productIdsToResequence) {
        try {
          const { data, error: assignError } = await supabase
            .rpc('assign_edition_numbers', { p_product_id: productId })
          
          if (assignError) {
            console.error(`Error assigning edition numbers for product ${productId}:`, assignError)
            editionAssignmentErrors++
          } else {
            console.log(`Assigned ${data} edition numbers for product ${productId}`)
            editionAssignments++
          }
        } catch (error) {
          console.error(`Error in edition assignment for product ${productId}:`, error)
          editionAssignmentErrors++
        }
      }
    }

    // Update the sync timestamp
    const now = new Date().toISOString()

    // Record the sync
    try {
      const { error: logError } = await supabase.from("sync_logs").insert({
        created_at: now,
        type: "manual_sync",
        details: {
          ordersProcessed: processedCount,
          ordersSkipped: skippedCount,
          totalOrders: orders.length,
          endDate: now,
          lastOrderId: lastProcessedOrder?.id,
          lastOrderName: lastProcessedOrder?.name,
          lastOrderNumber: lastProcessedOrder?.order_number,
          source: "manual_sync",
        },
      })

      if (logError) {
        console.error("Error recording sync operation:", logError)
      }
    } catch (updateError) {
      console.error("Error recording sync operation:", updateError)
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedOrders} orders and ${syncedLineItems} line items. Assigned edition numbers for ${editionAssignments} products.`,
      ordersProcessed: processedCount,
      ordersSkipped: skippedCount,
      totalOrders: orders.length,
      syncedOrders,
      syncedLineItems,
      errors,
      productsWithEditionsAssigned: editionAssignments,
      editionAssignmentErrors,
      timestamp: now,
    })
  } catch (error: any) {
    console.error("Error syncing Shopify orders:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to sync Shopify orders",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

async function fetchOrdersFromShopify() {
  let allOrders = []
  let hasMore = true
  let pageInfo = null
  let pageCount = 0

  try {
    while (hasMore) {
      pageCount++
      // Create URL with pagination (Shopify max limit is 250)
      // Note: When using page_info, we cannot include status parameter
      let url = `https://${SHOPIFY_SHOP}/admin/api/2023-10/orders.json?limit=250`
      if (pageInfo) {
        url += `&page_info=${pageInfo}`
      } else {
        url += `&status=any` // Only include status on first page
      }

      console.log(`[Page ${pageCount}] Fetching orders from: ${url}`)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch orders: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      const orders = data.orders || []
      
      // Log order numbers for debugging
      const orderNumbers = orders.map((order: any) => order.name).join(", ")
      console.log(`[Page ${pageCount}] Orders in this batch: ${orderNumbers}`)
      
      allOrders = allOrders.concat(orders)
      console.log(`[Page ${pageCount}] Successfully fetched ${orders.length} orders in this batch`)

      // Check for pagination
      const linkHeader = response.headers.get("link")
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const match = linkHeader.match(/page_info=([^>]+)>; rel="next"/)
        if (match) {
          pageInfo = match[1]
          console.log(`[Page ${pageCount}] Found next page token: ${pageInfo}`)
        } else {
          hasMore = false
          console.log(`[Page ${pageCount}] No next page token found`)
        }
      } else {
        hasMore = false
        console.log(`[Page ${pageCount}] No pagination link found`)
      }
    }

    console.log(`Total orders fetched: ${allOrders.length} across ${pageCount} pages`)
    // Log the range of order numbers
    if (allOrders.length > 0) {
      const firstOrder = allOrders[0].name
      const lastOrder = allOrders[allOrders.length - 1].name
      console.log(`Order number range: ${firstOrder} to ${lastOrder}`)
    }
  } catch (error) {
    console.error("Error in fetchOrdersFromShopify:", error)
    return []
  }

  return allOrders
}

async function processShopifyOrder(order: any) {
  try {
    console.log(`Processing order ${order.id} (${order.name})`)

    // Check if this order contains any line items for limited edition products
    const limitedEditionItems = order.line_items.filter((item: any) => {
      const isLimitedEdition = item.properties?.some(
        (prop: any) => prop.name === "limited_edition" && prop.value === "true",
      )

      if (isLimitedEdition) {
        console.log(`Found limited edition item in order ${order.name}:`, {
          lineItemId: item.id,
          productId: item.product_id,
          properties: item.properties
        })
      }

      return isLimitedEdition
    })

    if (limitedEditionItems.length === 0) {
      console.log(`Order ${order.name} does not contain any limited edition items`)
      return { processed: false }
    }

    console.log(`Found ${limitedEditionItems.length} limited edition items in order ${order.name}`)

    // Process each limited edition item
    let processedAny = false
    for (const item of limitedEditionItems) {
      const result = await processLineItem(order, item)
      if (result.processed) {
        processedAny = true
      }
    }

    console.log(`Finished processing order ${order.name}`)
    return { processed: processedAny }
  } catch (error) {
    console.error(`Error processing order ${order.name}:`, error)
    throw error
  }
}

async function processLineItem(order: any, lineItem: any) {
  try {
    const orderId = order.id.toString()
    const lineItemId = lineItem.id.toString()
    const productId = lineItem.product_id.toString()
    const vendorName =
      lineItem.vendor ||
      (lineItem.properties && lineItem.properties.find((p: any) => p.name === "vendor")?.value) ||
      null

    console.log(`Processing line item ${lineItemId} for product ${productId}, vendor: ${vendorName || "Unknown"}`)

    // Check if this line item already exists in the database
    const { data: existingItems, error: queryError } = await supabase
      .from("order_line_items")
      .select("*")
      .eq("order_id", orderId)
      .eq("line_item_id", lineItemId)

    if (queryError) {
      console.error(`Error checking existing line item:`, queryError)
      throw queryError
    }

    if (existingItems && existingItems.length > 0) {
      console.log(`Line item ${lineItemId} already exists in database, skipping`)
      return { processed: false }
    }

    // Generate certificate URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com"
    const certificateUrl = `${baseUrl}/pages/certificate?line_item_id=${lineItemId}`
    const certificateToken = crypto.randomUUID()
    const now = new Date().toISOString()

    // Insert the new line item
    const { error: insertError } = await supabase.from("order_line_items").insert({
      order_id: orderId,
      order_name: order.name,
      line_item_id: lineItemId,
      product_id: productId,
      variant_id: lineItem.variant_id?.toString(),
      vendor_name: vendorName,
      created_at: new Date(order.created_at).toISOString(),
      updated_at: now,
      status: lineItem.fulfillment_status === 'fulfilled' ? 'active' : 'inactive',
      certificate_url: certificateUrl,
      certificate_token: certificateToken,
      certificate_generated_at: now,
    })

    if (insertError) {
      console.error(`Error inserting line item:`, insertError)
      throw insertError
    }

    console.log(`Successfully inserted line item ${lineItemId}`)

    // Resequence edition numbers for this product
    await resequenceEditionNumbers(productId)
    return { processed: true }
  } catch (error) {
    console.error(`Error processing line item:`, error)
    throw error
  }
}

async function resequenceEditionNumbers(productId: string) {
  try {
    console.log(`Resequencing edition numbers for product ${productId}`)

    const { data: activeItems, error } = await supabase
      .from("order_line_items")
      .select("*")
      .eq("product_id", productId)
      .eq("status", "active")
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching active items for resequencing:", error)
      throw error
    }

    if (!activeItems || activeItems.length === 0) {
      console.log("No active items found for resequencing")
      return
    }

    console.log(`Found ${activeItems.length} active items to resequence`)

    let editionCounter = 1
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
        console.log(`Updated item ${item.line_item_id} with new edition number ${editionCounter}`)
        editionCounter++
      }
    }

    console.log(`Resequencing complete. Assigned edition numbers 1 through ${editionCounter - 1}`)
  } catch (error) {
    console.error("Error in resequenceEditionNumbers:", error)
    throw error
  }
} 