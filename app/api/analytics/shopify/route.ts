import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { supabaseAdmin } from "@/lib/supabase"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"

export async function GET(request: NextRequest) {
  try {
    // Get vendor name from cookie
    const cookieStore = cookies()
    const vendorName = cookieStore.get("vendor_session")?.value

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get time range from query params
    const searchParams = request.nextUrl.searchParams
    const timeRange = searchParams.get("timeRange") || "30days"

    console.log(`Fetching analytics for vendor: ${vendorName}, timeRange: ${timeRange}`)

    // Calculate date range
    const endDate = new Date()
    let startDate = new Date()

    switch (timeRange) {
      case "7days":
        startDate.setDate(endDate.getDate() - 7)
        break
      case "30days":
        startDate.setDate(endDate.getDate() - 30)
        break
      case "90days":
        startDate.setDate(endDate.getDate() - 90)
        break
      case "year":
        startDate.setDate(endDate.getDate() - 365)
        break
      case "all":
        startDate = new Date(2020, 0, 1) // Set to a far past date
        break
      default:
        startDate.setDate(endDate.getDate() - 30)
    }

    // Format dates for queries
    const startDateStr = startDate.toISOString().split("T")[0]
    const endDateStr = endDate.toISOString().split("T")[0]

    console.log(`Date range: ${startDateStr} to ${endDateStr}`)

    // First try to get data from Supabase
    const { data: lineItems, error } = await supabaseAdmin
      .from("order_line_items")
      .select("*")
      .eq("vendor_name", vendorName)
      .eq("status", "active")
      .gte("created_at", startDateStr)
      .lte("created_at", endDateStr)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching from Supabase:", error)
      // Continue with Shopify fallback
    }

    // If no data from Supabase or very few items, try fetching from Shopify as fallback
    let salesData = lineItems || []

    if (!salesData || salesData.length < 5) {
      console.log("Insufficient data from Supabase, fetching from Shopify as fallback")
      try {
        const shopifyData = await fetchVendorOrdersFromShopify(vendorName, startDateStr, endDateStr)
        if (shopifyData && shopifyData.length > 0) {
          salesData = shopifyData
          console.log(`Successfully fetched ${shopifyData.length} items from Shopify`)
        }
      } catch (shopifyError) {
        console.error("Error fetching from Shopify:", shopifyError)
        // Continue with whatever data we have
      }
    }

    // Process sales data by date
    const salesByDate = processSalesByDate(salesData)

    // Get top products
    const topProducts = getTopProducts(salesData)

    // Calculate totals
    const totalSales = salesData.length
    const totalRevenue = salesData.reduce((sum, item) => {
      const price = typeof item.price === "string" ? Number.parseFloat(item.price || "0") : item.price || 0
      return sum + price
    }, 0)

    // Mock analytics data for now
    const analyticsData = {
      sessions: generateMockSessions(startDate, endDate),
    }

    return NextResponse.json({
      salesData: salesByDate,
      topProducts,
      totalSales,
      totalRevenue,
      analyticsData,
    })
  } catch (error) {
    console.error("Error in analytics API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

// Process sales data by date
function processSalesByDate(salesData) {
  const salesByDate = {}

  salesData.forEach((item) => {
    // Format date to YYYY-MM-DD
    const dateStr = new Date(item.created_at).toISOString().split("T")[0]

    // Convert price to number
    const price = typeof item.price === "string" ? Number.parseFloat(item.price || "0") : item.price || 0

    // Initialize or update date entry
    if (!salesByDate[dateStr]) {
      salesByDate[dateStr] = { date: dateStr, sales: 0, revenue: 0 }
    }

    salesByDate[dateStr].sales += 1
    salesByDate[dateStr].revenue += price
  })

  // Convert to array and sort by date
  return Object.values(salesByDate).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

// Get top products
function getTopProducts(salesData) {
  const productMap = {}

  salesData.forEach((item) => {
    const productId = item.product_id
    if (!productId) return

    const price = typeof item.price === "string" ? Number.parseFloat(item.price || "0") : item.price || 0

    if (!productMap[productId]) {
      productMap[productId] = {
        id: productId,
        title: item.title || `Product ${productId}`,
        sales: 0,
        revenue: 0,
      }
    }

    productMap[productId].sales += 1
    productMap[productId].revenue += price
  })

  // Convert to array and sort by sales
  return Object.values(productMap)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5) // Top 5 products
}

// Generate mock sessions data
function generateMockSessions(startDate, endDate) {
  const sessions = []
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split("T")[0]
    const randomSessions = Math.floor(Math.random() * 100) + 20

    sessions.push({
      date: dateStr,
      totalSessionsCount: randomSessions,
      mobileSessionsCount: Math.floor(randomSessions * 0.6),
      desktopSessionsCount: Math.floor(randomSessions * 0.4),
      conversionRate: (Math.random() * 5 + 1).toFixed(1) + "%",
    })

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return sessions
}

// Fetch vendor orders from Shopify
async function fetchVendorOrdersFromShopify(vendorName, startDate, endDate) {
  try {
    console.log(`Fetching orders from Shopify for vendor: ${vendorName}, date range: ${startDate} to ${endDate}`)

    // Build the GraphQL query to fetch orders containing products from this vendor
    const graphqlQuery = `
      {
        orders(
          first: 50, 
          query: "created_at:>=${startDate} created_at:<=${endDate} status:any"
        ) {
          edges {
            node {
              id
              name
              createdAt
              lineItems(first: 50) {
                edges {
                  node {
                    id
                    title
                    quantity
                    vendor
                    product {
                      id
                      title
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
            title: lineItem.title || lineItem.product?.title,
            variant_id: lineItem.variant?.id.split("/").pop(),
            price: lineItem.variant?.price || "0.00",
            quantity: lineItem.quantity || 1,
            created_at: order.createdAt,
            vendor_name: vendorName,
            status: "active",
            edition_number: 1, // Assume all items are edition 1 for fallback
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
