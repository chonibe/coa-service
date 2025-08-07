import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"

// Set a reasonable timeout for the API route
export const maxDuration = 30 // 30 seconds max duration

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

    const { orderId, startAfterId = 0 } = body

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    console.log(`Processing vendor names for order ${orderId}, starting after ID ${startAfterId}`)

    // Fetch line items for this order that don't have a vendor_name
    const { data: lineItems, error } = await supabase
      .from("order_line_items")
      .select("*")
      .eq("order_id", orderId)
      .is("vendor_name", null)
      .gt("id", startAfterId)
      .order("id", { ascending: true })
      .limit(50)

    if (error) {
      console.error("Error fetching line items:", error)
      return NextResponse.json({ error: "Failed to fetch line items", details: error.message }, { status: 500 })
    }

    console.log(`Found ${lineItems?.length || 0} line items without vendor name for order ${orderId}`)

    if (!lineItems || lineItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No line items found for order ${orderId} that need vendor name updates`,
        processed: 0,
        updated: 0,
        lastId: startAfterId,
        hasMore: false,
      })
    }

    // Fetch the order from Shopify
    const order = await fetchOrderFromShopify(orderId)

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: `Order ${orderId} not found in Shopify`,
          processed: 0,
          updated: 0,
          lastId: startAfterId,
        },
        { status: 404 },
      )
    }

    // Process each line item
    let processedItems = 0
    let updatedItems = 0
    let lastProcessedId = startAfterId

    for (const item of lineItems) {
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

    // Check if there are more items to process for this order
    const { count, error: countError } = await supabase
      .from("order_line_items")
      .select("*", { count: "exact", head: true })
      .eq("order_id", orderId)
      .is("vendor_name", null)
      .gt("id", lastProcessedId)

    if (countError) {
      console.error("Error checking for more items:", countError)
    }

    const hasMore = (count || 0) > 0

    return NextResponse.json({
      success: true,
      processed: processedItems,
      updated: updatedItems,
      lastId: lastProcessedId,
      hasMore,
      message: `Processed ${processedItems} line items, updated ${updatedItems} with vendor names for order ${orderId}`,
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
