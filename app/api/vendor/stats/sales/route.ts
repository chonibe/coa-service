import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"

export async function GET() {
  const supabase = createClient()
  
  try {
    // Get the vendor name from the cookie
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    console.log(`Fetching sales data for vendor: ${vendorName}`)

    // Query database for line items with active certificates for this vendor
    const { data: lineItems, error: lineItemsError } = await supabase
      .from("order_line_items")
      .select(`
        id,
        line_item_id,
        order_id,
        order_name,
        product_id,
        variant_id,
        price,
        quantity,
        edition_number,
        created_at,
        vendor_name,
        status
      `)
      .eq("vendor_name", vendorName)
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (lineItemsError) {
      console.error("Error fetching line items from Supabase:", lineItemsError)
      // We'll continue and try to fetch from Shopify instead
    }

    // If no data from Supabase or very few items, try fetching from Shopify as fallback
    let salesData = lineItems || []

    if (!salesData || salesData.length < 5) {
      console.log("Insufficient data from Supabase, fetching from Shopify as fallback")
      try {
        const shopifyData = await fetchVendorSalesFromShopify(vendorName)
        if (shopifyData && shopifyData.length > 0) {
          salesData = shopifyData
          console.log(`Successfully fetched ${shopifyData.length} items from Shopify`)
        }
      } catch (shopifyError) {
        console.error("Error fetching from Shopify:", shopifyError)
        // Continue with whatever data we have
      }
    }

    // Group items by date (YYYY-MM-DD)
    const salesByDate: Record<string, { sales: number; revenue: number }> = {}
    let totalSales = 0
    let totalRevenue = 0

    salesData.forEach((item) => {
      // Format created_at date to YYYY-MM-DD
      const dateStr = new Date(item.created_at).toISOString().split("T")[0]

      // Convert price to number if it's a string
      const price = typeof item.price === "string" ? Number.parseFloat(item.price || "0") : item.price || 0

      // Initialize the date entry if it doesn't exist
      if (!salesByDate[dateStr]) {
        salesByDate[dateStr] = { sales: 0, revenue: 0 }
      }

      // Add the line item to the totals
      salesByDate[dateStr].sales += 1
      salesByDate[dateStr].revenue += price

      // Update overall totals
      totalSales += 1
      totalRevenue += price
    })

    // Convert the salesByDate object to an array for the chart
    const chartSalesData = Object.entries(salesByDate).map(([date, stats]) => ({
      date,
      sales: stats.sales,
      revenue: stats.revenue,
    }))

    // Sort by date (oldest to newest)
    chartSalesData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Only return the last 30 days for the chart
    const last30Days = chartSalesData.slice(-30)

    return NextResponse.json({
      salesByDate: last30Days,
      totalSales,
      totalRevenue,
    })
  } catch (error: any) {
    console.error("Error in vendor sales stats API:", error)
    return NextResponse.json(
      {
        message: error.message || "An error occurred",
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

// Add a function to fetch vendor sales from Shopify as fallback
async function fetchVendorSalesFromShopify(vendorName: string) {
  try {
    console.log(`Fetching sales data from Shopify for vendor: ${vendorName}`)

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
