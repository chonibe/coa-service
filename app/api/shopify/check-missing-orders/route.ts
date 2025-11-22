import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  try {
    const { searchParams } = new URL(request.url)
    const days = Number.parseInt(searchParams.get("days") || "7")

    // Calculate the start date (default to 7 days ago)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Fetch recent orders from Shopify
    const shopifyOrders = await fetchRecentOrdersFromShopify(startDate)
    console.log(`Fetched ${shopifyOrders.length} orders from Shopify`)

    // Get all order IDs from Supabase for the same period
    const { data: supabaseOrders, error } = await supabase
      .from("order_line_items")
      .select("order_id, order_name")
      .gte("created_at", startDate.toISOString())

    if (error) {
      console.error("Error fetching orders from Supabase:", error)
      throw error
    }

    // Create a Set of order IDs that are already in Supabase
    const existingOrderIds = new Set(supabaseOrders?.map((item) => item.order_id) || [])

    // Find orders that are in Shopify but not in Supabase
    const missingOrders = shopifyOrders.filter((order) => !existingOrderIds.has(order.id.toString()))

    // Check for limited edition items in the missing orders
    const missingOrdersWithLimitedEditions = await Promise.all(
      missingOrders.map(async (order) => {
        // Check if this order contains any line items for limited edition products
        const limitedEditionItems = order.line_items.filter((item: any) => {
          // Check if this is a limited edition product based on properties or tags
          const isLimitedEdition =
            (item.properties &&
              item.properties.some((prop: any) => prop.name === "limited_edition" && prop.value === "true")) ||
            (order.tags && typeof order.tags === "string" && order.tags.toLowerCase().includes("limited"))

          return isLimitedEdition
        })

        // If we couldn't determine from properties, try to get product details
        if (limitedEditionItems.length === 0 && order.line_items.length > 0) {
          try {
            // Get more details for the first line item's product
            const productId = order.line_items[0].product_id
            if (productId) {
              const productDetails = await getProductDetails(productId)
              if (
                productDetails &&
                productDetails.tags &&
                typeof productDetails.tags === "string" &&
                productDetails.tags.toLowerCase().includes("limited")
              ) {
                // If the product has a limited edition tag, consider all line items as limited edition
                return {
                  ...order,
                  has_limited_editions: true,
                  limited_edition_count: order.line_items.length,
                  limited_edition_items: order.line_items.map((item: any) => ({
                    id: item.id,
                    product_id: item.product_id,
                    title: item.title,
                    quantity: item.quantity,
                  })),
                }
              }
            }
          } catch (error) {
            console.error(`Error getting product details for order ${order.id}:`, error)
          }
        }

        return {
          ...order,
          has_limited_editions: limitedEditionItems.length > 0,
          limited_edition_count: limitedEditionItems.length,
          limited_edition_items: limitedEditionItems.map((item: any) => ({
            id: item.id,
            product_id: item.product_id,
            title: item.title,
            quantity: item.quantity,
          })),
        }
      }),
    )

    // Filter to only show orders with limited editions
    const relevantMissingOrders = missingOrdersWithLimitedEditions.filter((order) => order.has_limited_editions)

    return NextResponse.json({
      total_shopify_orders: shopifyOrders.length,
      total_supabase_orders: supabaseOrders?.length || 0,
      missing_orders_count: missingOrders.length,
      relevant_missing_orders_count: relevantMissingOrders.length,
      missing_orders: relevantMissingOrders.map((order) => ({
        id: order.id,
        name: order.name,
        order_number: order.order_number,
        created_at: order.created_at,
        processed_at: order.processed_at,
        limited_edition_count: order.limited_edition_count,
        limited_edition_items: order.limited_edition_items,
      })),
    })
  } catch (error: any) {
    console.error("Error checking for missing orders:", error)
    return NextResponse.json({ error: error.message || "Failed to check for missing orders" }, { status: 500 })
  }
}

/**
 * Fetch recent orders from Shopify API using cursor-based pagination
 */
async function fetchRecentOrdersFromShopify(startDate: Date) {
  let allOrders = []
  let nextLink = null

  try {
    // Initial URL without page parameter
    const initialUrl = `https://${SHOPIFY_SHOP}/admin/api/2023-10/orders.json?limit=250&created_at_min=${startDate.toISOString()}&status=any`
    let currentUrl = initialUrl

    do {
      console.log(`Fetching orders from: ${currentUrl}`)

      const response = await fetch(currentUrl, {
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

      allOrders = [...allOrders, ...orders]
      console.log(`Fetched ${orders.length} orders, total so far: ${allOrders.length}`)

      // Check for Link header for pagination
      const linkHeader = response.headers.get("Link")
      nextLink = null

      if (linkHeader) {
        // Parse the Link header to get the next page URL
        const links = linkHeader.split(",")
        for (const link of links) {
          const [url, rel] = link.split(";")
          if (rel.includes('rel="next"')) {
            // Extract the URL from the angle brackets
            nextLink = url.trim().replace(/<|>/g, "")
            console.log(`Found next page URL: ${nextLink}`)
            break
          }
        }
      }

      // Update the current URL for the next iteration
      currentUrl = nextLink || ""

      // Limit to 1000 orders to prevent excessive API calls
      if (allOrders.length >= 1000) {
        console.log("Reached maximum order limit (1000), stopping pagination")
        break
      }
    } while (nextLink)

    return allOrders
  } catch (error) {
    console.error("Error in fetchRecentOrdersFromShopify:", error)
    // Return empty array instead of throwing to prevent the entire function from failing
    return []
  }
}

/**
 * Get product details from Shopify
 */
async function getProductDetails(productId: string) {
  try {
    const url = `https://${SHOPIFY_SHOP}/admin/api/2023-10/products/${productId}.json`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.product
  } catch (error) {
    console.error(`Error fetching product ${productId}:`, error)
    return null
  }
}
