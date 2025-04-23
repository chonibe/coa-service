import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    // Check for admin authentication
    // This is a potentially long-running operation, so we should restrict access
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    if (token !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get parameters from request body
    const body = await request.json()
    const { batchSize = 50, startAfter = 0, limit = 1000 } = body

    console.log(`Starting vendor name sync with batchSize=${batchSize}, startAfter=${startAfter}, limit=${limit}`)

    // Fetch line items that don't have a vendor_name
    const { data: lineItems, error } = await supabase
      .from("order_line_items")
      .select("*")
      .is("vendor_name", null)
      .gt("id", startAfter)
      .order("id", { ascending: true })
      .limit(limit)

    if (error) {
      console.error("Error fetching line items:", error)
      return NextResponse.json({ error: "Failed to fetch line items" }, { status: 500 })
    }

    console.log(`Found ${lineItems.length} line items without vendor name`)

    if (lineItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No line items found that need vendor name updates",
        processed: 0,
        lastId: startAfter,
      })
    }

    // Group line items by order_id to minimize API calls to Shopify
    const orderGroups = {}
    lineItems.forEach((item) => {
      if (!orderGroups[item.order_id]) {
        orderGroups[item.order_id] = []
      }
      orderGroups[item.order_id].push(item)
    })

    console.log(`Grouped into ${Object.keys(orderGroups).length} orders`)

    // Process each order
    let processedItems = 0
    let updatedItems = 0
    let lastProcessedId = startAfter
    let hasMore = false

    for (const orderId of Object.keys(orderGroups)) {
      try {
        // Fetch order from Shopify
        const order = await fetchOrderFromShopify(orderId)

        if (!order) {
          console.log(`Order ${orderId} not found in Shopify, skipping`)
          continue
        }

        // Process each line item in this order
        for (const item of orderGroups[orderId]) {
          processedItems++
          lastProcessedId = item.id

          // Find matching line item in Shopify order
          const shopifyLineItem = order.line_items.find((li) => li.id.toString() === item.line_item_id)

          if (!shopifyLineItem) {
            console.log(`Line item ${item.line_item_id} not found in Shopify order ${orderId}, skipping`)
            continue
          }

          // Extract vendor name from Shopify line item
          const vendorName =
            shopifyLineItem.vendor ||
            (shopifyLineItem.properties && shopifyLineItem.properties.find((p) => p.name === "vendor")?.value) ||
            null

          if (!vendorName) {
            console.log(`No vendor name found for line item ${item.line_item_id}, skipping`)
            continue
          }

          // Update line item in database
          const { error: updateError } = await supabase
            .from("order_line_items")
            .update({
              vendor_name: vendorName,
              updated_at: new Date().toISOString(),
            })
            .eq("id", item.id)

          if (updateError) {
            console.error(`Error updating vendor name for line item ${item.id}:`, updateError)
            continue
          }

          console.log(`Updated vendor name to "${vendorName}" for line item ${item.line_item_id}`)
          updatedItems++
        }
      } catch (orderError) {
        console.error(`Error processing order ${orderId}:`, orderError)
        continue
      }

      // Check if we've reached the batch size limit
      if (processedItems >= batchSize) {
        hasMore = lineItems.length >= batchSize
        break
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedItems,
      updated: updatedItems,
      lastId: lastProcessedId,
      hasMore,
      message: `Processed ${processedItems} line items, updated ${updatedItems} with vendor names`,
    })
  } catch (error) {
    console.error("Error syncing vendor names:", error)
    return NextResponse.json({ error: "Failed to sync vendor names" }, { status: 500 })
  }
}

/**
 * Fetch an order from Shopify API
 */
async function fetchOrderFromShopify(orderId: string) {
  const url = `https://${SHOPIFY_SHOP}/admin/api/2023-10/orders/${orderId}.json`
  console.log(`Fetching order ${orderId} from Shopify`)

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Order ${orderId} not found in Shopify`)
        return null
      }
      const errorText = await response.text()
      throw new Error(`Failed to fetch order: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    return data.order
  } catch (error) {
    console.error(`Error fetching order ${orderId} from Shopify:`, error)
    return null
  }
}
