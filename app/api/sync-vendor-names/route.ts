import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"

// Set a reasonable timeout for the API route
export const maxDuration = 60 // 60 seconds max duration

export async function POST() {
  const supabase = createClient()
  
  try {
    // Check for admin authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    if (token !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get parameters from request body
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    // Use smaller default batch size to avoid timeouts
    const { batchSize = 10, startAfter = 0, limit = 50 } = body

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
      return NextResponse.json({ error: "Failed to fetch line items", details: error.message }, { status: 500 })
    }

    console.log(`Found ${lineItems?.length || 0} line items without vendor name`)

    if (!lineItems || lineItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No line items found that need vendor name updates",
        processed: 0,
        updated: 0,
        lastId: startAfter,
        hasMore: false,
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

    // Process only a limited number of orders per request to avoid timeouts
    const orderIds = Object.keys(orderGroups).slice(0, Math.min(5, Object.keys(orderGroups).length))

    for (const orderId of orderIds) {
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
    }

    // Check if there are more items to process
    hasMore = lineItems.length > processedItems || lineItems.length >= limit

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
    return NextResponse.json(
      {
        error: "Failed to sync vendor names",
        message: error.message || "Unknown error",
      },
      { status: 500 },
    )
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

      let errorText
      try {
        errorText = await response.text()
      } catch (e) {
        errorText = `Status: ${response.status}`
      }

      throw new Error(`Failed to fetch order: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    return data.order
  } catch (error) {
    console.error(`Error fetching order ${orderId} from Shopify:`, error)
    return null
  }
}
