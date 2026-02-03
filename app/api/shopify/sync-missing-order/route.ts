import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = createClient()
  
  try {
    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    // Fetch the order from Shopify
    const order = await fetchOrderFromShopify(orderId)

    if (!order) {
      return NextResponse.json({ error: "Order not found in Shopify" }, { status: 404 })
    }

    // Sync the entire order to database (all orders, not just limited edition)
    await syncOrderToDatabase(order, supabase)

    // Also process limited edition items for the old system (if needed)
    const result = await processShopifyOrder(order)

    return NextResponse.json({
      success: true,
      message: `Order ${order.name} synced successfully`,
      result,
    })
  } catch (error: any) {
    console.error("Error syncing missing order:", error)
    return NextResponse.json({ error: error.message || "Failed to sync missing order" }, { status: 500 })
  }
}

/**
 * Fetch an order from Shopify API
 */
async function fetchOrderFromShopify(orderId: string) {
  const url = `https://${SHOPIFY_SHOP}/admin/api/2023-10/orders/${orderId}.json`

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    if (response.status === 404) {
      return null
    }
    const errorText = await response.text()
    throw new Error(`Failed to fetch order: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  return data.order
}

/**
 * Sync order to database - syncs ALL orders, not just limited edition
 */
async function syncOrderToDatabase(order: any, supabase: any) {
  try {
    console.log(`[sync-missing-order] Syncing order ${order.id} (${order.name}) to database`)

    // Determine archived status
    const tags = (order.tags || "").toLowerCase()
    const archived = tags.includes("archived") || order.status === "closed" || false

    // Upsert order
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
      cancelled_at: order.cancelled_at || null,
      archived: archived,
      shopify_order_status: order.status || null,
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
      console.error(`[sync-missing-order] Error upserting order ${order.name}:`, orderError)
      return
    }

    // Sync line items to order_line_items_v2
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
        const isRestocked = Boolean(restockedLineItemIds.has(item.id))
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
        console.error(`[sync-missing-order] Error inserting line items for order ${order.name}:`, lineItemsError)
      } else {
        console.log(`[sync-missing-order] Synced ${lineItems.length} line items for order ${order.name}`)
        
        // Collect product IDs for logging/debugging purposes only
        // Edition numbers are automatically assigned by database triggers
        const productIdsWithActiveItems = new Set<string>()
        lineItems.forEach((item: any) => {
          if (item.status === 'active' && item.product_id) {
            productIdsWithActiveItems.add(item.product_id)
          }
        })
        
        if (productIdsWithActiveItems.size > 0) {
          console.log(`[sync-missing-order] Active items synced for ${productIdsWithActiveItems.size} products. Edition numbers will be auto-assigned by triggers.`)
        }
      }
    }

    console.log(`[sync-missing-order] Successfully synced order ${order.name} to database`)
  } catch (error) {
    console.error(`[sync-missing-order] Error syncing order ${order.name} to database:`, error)
    throw error
  }
}

/**
 * Process a Shopify order and update edition numbers (legacy - for old order_line_items table)
 */
async function processShopifyOrder(order: any) {
  try {
    console.log(`Processing order ${order.id} (${order.name})`)

    // Check if this order contains any line items for limited edition products
    const limitedEditionItems = order.line_items.filter((item: any) => {
      // Check if this is a limited edition product based on properties or tags
      const isLimitedEdition =
        (item.properties &&
          item.properties.some((prop: any) => prop.name === "limited_edition" && prop.value === "true")) ||
        (item.product &&
          item.product.tags &&
          typeof item.product.tags === "string" &&
          item.product.tags.toLowerCase().includes("limited"))

      return isLimitedEdition
    })

    if (limitedEditionItems.length === 0) {
      console.log(`Order ${order.id} does not contain any limited edition items`)
      return {
        orderId: order.id,
        orderName: order.name,
        limitedEditionItems: 0,
        message: "No limited edition items found",
      }
    }

    console.log(`Found ${limitedEditionItems.length} limited edition items in order ${order.id}`)

    // Process each limited edition item
    const processedItems = []
    for (const item of limitedEditionItems) {
      const result = await processLineItem(order, item)
      processedItems.push(result)
    }

    console.log(`Finished processing order ${order.id}`)

    return {
      orderId: order.id,
      orderName: order.name,
      limitedEditionItems: limitedEditionItems.length,
      processedItems,
    }
  } catch (error) {
    console.error(`Error processing order ${order.id}:`, error)
    throw error
  }
}

// Add the getProductMetafields function to this file as well
async function getProductMetafields(productId: string) {
  try {
    const url = `https://${SHOPIFY_SHOP}/admin/api/2023-10/products/${productId}/metafields.json`
    console.log(`Fetching metafields for product ${productId}`)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch product metafields: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    const metafields = data.metafields || []

    // Look for Edition Size metafield with various possible keys
    const editionSizeMetafield = metafields.find(
      (meta: any) =>
        meta.key.toLowerCase() === "edition_size" ||
        meta.key.toLowerCase() === "edition size" ||
        meta.key.toLowerCase() === "limited_edition_size" ||
        meta.key.toLowerCase() === "total_edition",
    )

    let editionSize = null
    if (editionSizeMetafield && editionSizeMetafield.value) {
      // Try to parse the edition size as a number
      const sizeValue = Number.parseInt(editionSizeMetafield.value, 10)
      if (!isNaN(sizeValue) && sizeValue > 0) {
        editionSize = sizeValue
      }
    }

    return {
      editionSize,
      allMetafields: metafields,
    }
  } catch (error) {
    console.error(`Error fetching metafields for product ${productId}:`, error)
    return {
      editionSize: null,
      allMetafields: [],
    }
  }
}

// Update the processLineItem function in this file as well
async function processLineItem(order: any, lineItem: any) {
  try {
    const orderId = order.id.toString()
    const lineItemId = lineItem.id.toString()
    const productId = lineItem.product_id.toString()
    // Extract vendor name from line item properties or vendor field
    const vendorName =
      lineItem.vendor ||
      (lineItem.properties && lineItem.properties.find((p: any) => p.name === "vendor")?.value) ||
      null

    console.log(`Processing line item ${lineItemId} for product ${productId}, vendor: ${vendorName || "Unknown"}`)

    // Fetch product metafields to get edition size
    const { editionSize } = await getProductMetafields(productId)
    console.log(`Edition size for product ${productId}: ${editionSize || "Not set"}`)

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

      // Update vendor_name if it's available and not set previously
      if (vendorName && !existingItems[0].vendor_name) {
        const { error: updateError } = await supabase
          .from("order_line_items")
          .update({
            vendor_name: vendorName,
            updated_at: new Date().toISOString(),
          })
          .eq("line_item_id", lineItemId)
          .eq("order_id", orderId)

        if (updateError) {
          console.error(`Error updating vendor name:`, updateError)
        } else {
          console.log(`Updated vendor name to ${vendorName} for line item ${lineItemId}`)
        }
      }

      return {
        lineItemId,
        productId,
        status: "already_exists",
        message: "Line item already exists in database",
      }
    }

    // Insert the new line item
    const { error: insertError } = await supabase.from("order_line_items").insert({
      order_id: orderId,
      order_name: order.name,
      line_item_id: lineItemId,
      product_id: productId,
      variant_id: lineItem.variant_id?.toString(),
      vendor_name: vendorName, // Add vendor name to the insert
      // Don't set edition_number here, it will be assigned during resequencing
      edition_total: editionSize, // Add the edition_total from the metafield
      created_at: new Date(order.created_at).toISOString(),
      updated_at: new Date().toISOString(),
      status: lineItem.fulfillment_status === 'fulfilled' ? 'active' : 'inactive',
    })

    if (insertError) {
      console.error(`Error inserting line item:`, insertError)
      throw insertError
    }

    console.log(`Successfully inserted line item ${lineItemId} with vendor ${vendorName || "Unknown"}`)

    // Resequence edition numbers for this product
    await resequenceEditionNumbers(productId)

    console.log(`Successfully processed line item ${lineItemId}`)

    return {
      lineItemId,
      productId,
      status: "inserted",
      message: "Line item inserted and edition numbers resequenced",
      editionSize: editionSize,
      vendorName: vendorName,
    }
  } catch (error) {
    console.error(`Error processing line item:`, error)
    throw error
  }
}

/**
 * Resequence edition numbers for a product
 */
async function resequenceEditionNumbers(productId: string) {
  try {
    console.log(`Resequencing edition numbers for product ${productId}`)

    // Get all active line items for this product, ordered by creation date
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

    // Assign new sequential edition numbers starting from 1
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
