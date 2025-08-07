import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

export async function POST() {
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

    // Process each order
    let processedCount = 0
    let skippedCount = 0
    let lastProcessedOrder = null
    for (const order of orders) {
      const result = await processShopifyOrder(order)
      if (result.processed) {
        processedCount++
        lastProcessedOrder = order
      } else {
        skippedCount++
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
      ordersProcessed: processedCount,
      ordersSkipped: skippedCount,
      totalOrders: orders.length,
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
      // Create URL with pagination
      let url = `https://${SHOPIFY_SHOP}/admin/api/2023-10/orders.json?limit=500&status=any`
      if (pageInfo) {
        url += `&page_info=${pageInfo}`
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
      status: "active",
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