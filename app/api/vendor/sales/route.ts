import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabaseAdmin } from "@/lib/supabase"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"

export async function GET() {
  try {
    // Get vendor name from cookie
    const cookieStore = cookies()
    const vendorName = cookieStore.get("vendor_session")?.value

    if (!vendorName) {
      console.log("Vendor not authenticated")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log(`Fetching sales data for vendor: ${vendorName}`)

    // Simple direct query to get all active line items for this vendor
    const { data: lineItems, error } = await supabaseAdmin
      .from("order_line_items")
      .select("*")
      .eq("vendor_name", vendorName)
      .eq("status", "active")

    if (error) {
      console.error("Database error:", error)
      // Continue with fallback
    }

    // If no data from Supabase or very few items, try fetching from Shopify as fallback
    let salesData = lineItems || []

    if (!salesData || salesData.length < 5) {
      console.log("Insufficient data from Supabase, fetching from Shopify as fallback")
      try {
        const shopifyData = await fetchVendorOrdersFromShopify(vendorName)
        if (shopifyData && shopifyData.length > 0) {
          salesData = shopifyData
          console.log(`Successfully fetched ${shopifyData.length} items from Shopify`)
        }
      } catch (shopifyError) {
        console.error("Error fetching from Shopify:", shopifyError)
        // Continue with whatever data we have
      }
    }

    console.log(`Found ${salesData.length} line items for vendor ${vendorName}`)

    // Process the data
    const salesByMonth = {}
    let totalSales = 0
    let totalRevenue = 0

    salesData.forEach((item) => {
      // Include all active items
      if (item.status === "active") {
        totalSales++

        // Handle price - convert to number if needed
        let price = 0
        if (item.price) {
          price = typeof item.price === "string" ? Number.parseFloat(item.price) : item.price
        }
        totalRevenue += price

        // Group by month for the chart
        const date = new Date(item.created_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

        if (!salesByMonth[monthKey]) {
          salesByMonth[monthKey] = { month: monthKey, sales: 0, revenue: 0 }
        }

        salesByMonth[monthKey].sales++
        salesByMonth[monthKey].revenue += price
      }
    })

    // Convert to array and sort by date
    const monthlySales = Object.values(salesByMonth).sort((a, b) => a.month.localeCompare(b.month))

    console.log(`Processed data: ${totalSales} total sales, $${totalRevenue.toFixed(2)} total revenue`)
    console.log(`Monthly data points: ${monthlySales.length}`)

    return NextResponse.json({
      totalSales,
      totalRevenue,
      monthlySales,
    })
  } catch (error) {
    console.error("Unexpected error in vendor sales API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

// Add a function to fetch vendor orders from Shopify as fallback
async function fetchVendorOrdersFromShopify(vendorName: string) {
  try {
    console.log(`Fetching orders data from Shopify for vendor: ${vendorName}`)

    // Build the GraphQL query to fetch orders containing products from this vendor
    const graphqlQuery = `
      {
        orders(first: 50, query: "status:any") {
          edges {
            node {
              id
              name
              createdAt
              lineItems(first: 50) {
                edges {
                  node {
                    id
                    quantity
                    vendor
                    product {
                      id
                      vendor
                    }
                    variant {
                      id
                      price
                    }
                  }
                }
              }
            }
          }
        }
      }
    `

    // Make the request to Shopify
    const url = `https://${SHOPIFY_SHOP}/admin/api/2023-10/graphql.json`
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: graphqlQuery }),
    })

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (!data || !data.data || !data.data.orders) {
      throw new Error("Invalid response from Shopify GraphQL API")
    }

    // Process the orders to extract line items for this vendor
    const vendorLineItems = []

    for (const orderEdge of data.data.orders.edges) {
      const order = orderEdge.node

      for (const lineItemEdge of order.lineItems.edges) {
        const lineItem = lineItemEdge.node

        // Check if this line item is from our vendor
        const isVendorItem =
          (lineItem.vendor && lineItem.vendor.toLowerCase() === vendorName.toLowerCase()) ||
          (lineItem.product &&
            lineItem.product.vendor &&
            lineItem.product.vendor.toLowerCase() === vendorName.toLowerCase())

        if (isVendorItem) {
          vendorLineItems.push({
            line_item_id: lineItem.id.split("/").pop(),
            order_id: order.id.split("/").pop(),
            order_name: order.name,
            product_id: lineItem.product?.id.split("/").pop(),
            variant_id: lineItem.variant?.id.split("/").pop(),
            price: lineItem.variant?.price || "0.00",
            quantity: lineItem.quantity || 1,
            created_at: order.createdAt,
            vendor_name: vendorName,
            status: "active",
          })
        }
      }
    }

    return vendorLineItems
  } catch (error) {
    console.error("Error fetching from Shopify:", error)
    throw error
  }
}
