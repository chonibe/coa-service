import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { shopifyFetch, safeJsonParse } from "@/lib/shopify-api"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    // Get vendor name from cookie
    const cookieStore = cookies()
    const vendorName = cookieStore.get("vendor_session")?.value

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get time range from query params
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get("timeRange") || "30days"

    // Calculate date range based on timeRange
    const endDate = new Date()
    const startDate = new Date()

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
      default:
        startDate.setDate(endDate.getDate() - 30)
    }

    // Format dates for GraphQL query
    const formattedStartDate = startDate.toISOString().split("T")[0]
    const formattedEndDate = endDate.toISOString().split("T")[0]

    // Get vendor's products
    const productsData = await fetchProductsByVendor(vendorName)
    const productIds = productsData.products.map((p: any) => p.id)

    // Get sales data from Shopify Analytics
    const analyticsData = await fetchShopifyAnalytics(formattedStartDate, formattedEndDate, productIds)

    // Get sales data from database for this vendor
    const { data: lineItems, error } = await supabaseAdmin
      .from("order_line_items")
      .select("*")
      .eq("vendor_name", vendorName)
      .eq("status", "active")
      .gte("created_at", formattedStartDate)
      .lte("created_at", formattedEndDate)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Process line items to get sales by date
    const salesByDate: Record<string, { sales: number; revenue: number }> = {}

    lineItems.forEach((item) => {
      const dateStr = new Date(item.created_at).toISOString().split("T")[0]
      const price = typeof item.price === "string" ? Number.parseFloat(item.price || "0") : item.price || 0

      if (!salesByDate[dateStr]) {
        salesByDate[dateStr] = { sales: 0, revenue: 0 }
      }

      salesByDate[dateStr].sales += 1
      salesByDate[dateStr].revenue += price
    })

    // Convert to array and sort by date
    const salesData = Object.entries(salesByDate)
      .map(([date, stats]) => ({
        date,
        sales: stats.sales,
        revenue: stats.revenue,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Calculate totals
    const totalSales = lineItems.length
    const totalRevenue = lineItems.reduce((sum, item) => {
      const price = typeof item.price === "string" ? Number.parseFloat(item.price || "0") : item.price || 0
      return sum + price
    }, 0)

    // Get top selling products
    const productSales: Record<string, { sales: number; revenue: number; title: string }> = {}

    for (const item of lineItems) {
      if (!productSales[item.product_id]) {
        // Find product title from Shopify data
        const product = productsData.products.find((p: any) => p.id === item.product_id)
        productSales[item.product_id] = {
          sales: 0,
          revenue: 0,
          title: product?.title || `Product ${item.product_id}`,
        }
      }

      const price = typeof item.price === "string" ? Number.parseFloat(item.price || "0") : item.price || 0
      productSales[item.product_id].sales += 1
      productSales[item.product_id].revenue += price
    }

    // Convert to array and sort by sales
    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({
        id,
        title: data.title,
        sales: data.sales,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)

    // Combine all data
    return NextResponse.json({
      salesData,
      totalSales,
      totalRevenue,
      topProducts,
      analyticsData,
      timeRange,
    })
  } catch (error: any) {
    console.error("Error in analytics API:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}

async function fetchProductsByVendor(vendorName: string) {
  try {
    // Build the GraphQL query to fetch products for this vendor
    const graphqlQuery = `
      {
        products(
          first: 250
          query: "vendor:${vendorName}"
        ) {
          edges {
            node {
              id
              title
              handle
              vendor
              productType
              totalInventory
              priceRangeV2 {
                minVariantPrice {
                  amount
                  currencyCode
                }
                maxVariantPrice {
                  amount
                  currencyCode
                }
              }
              images(first: 1) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
            }
          }
        }
      }
    `

    // Make the request to Shopify
    const response = await shopifyFetch("graphql.json", {
      method: "POST",
      body: JSON.stringify({ query: graphqlQuery }),
    })

    const data = await safeJsonParse(response)

    if (!data || !data.data || !data.data.products) {
      console.error("Invalid response from Shopify GraphQL API:", data)
      throw new Error("Invalid response from Shopify GraphQL API")
    }

    // Extract products
    const products = data.data.products.edges.map((edge: any) => {
      const product = edge.node

      // Extract the first image if available
      const image = product.images.edges.length > 0 ? product.images.edges[0].node.url : null

      return {
        id: product.id.split("/").pop(),
        title: product.title,
        handle: product.handle,
        vendor: product.vendor,
        productType: product.productType,
        inventory: product.totalInventory,
        price: product.priceRangeV2.minVariantPrice.amount,
        currency: product.priceRangeV2.minVariantPrice.currencyCode,
        image,
      }
    })

    return { products }
  } catch (error) {
    console.error("Error fetching products by vendor:", error)
    throw error
  }
}

async function fetchShopifyAnalytics(startDate: string, endDate: string, productIds: string[]) {
  try {
    // Build the GraphQL query for analytics data
    const graphqlQuery = `
      {
        shopifyAnalytics {
          sales(
            first: 50,
            after: "${startDate}",
            before: "${endDate}"
          ) {
            edges {
              node {
                date
                netSales
                grossSales
                onlineStoreSessionsCount
                returnedItemsCount
                shippingAndHandling
                taxes
                totalOrders
                totalItemsOrdered
              }
            }
          }
          onlineStoreSessions(
            first: 50,
            after: "${startDate}",
            before: "${endDate}"
          ) {
            edges {
              node {
                date
                mobileSessionsCount
                desktopSessionsCount
                totalSessionsCount
                averageSessionDuration
                bounceRate
                conversionRate
              }
            }
          }
        }
      }
    `

    // Make the request to Shopify
    const response = await shopifyFetch("graphql.json", {
      method: "POST",
      body: JSON.stringify({ query: graphqlQuery }),
    })

    const data = await safeJsonParse(response)

    if (!data || !data.data || !data.data.shopifyAnalytics) {
      console.error("Invalid response from Shopify Analytics API:", data)
      return {
        sales: [],
        sessions: [],
      }
    }

    // Extract and format analytics data
    const sales = data.data.shopifyAnalytics.sales.edges.map((edge: any) => edge.node)
    const sessions = data.data.shopifyAnalytics.onlineStoreSessions.edges.map((edge: any) => edge.node)

    return {
      sales,
      sessions,
    }
  } catch (error) {
    console.error("Error fetching Shopify analytics:", error)
    // Return empty data instead of throwing to prevent the entire request from failing
    return {
      sales: [],
      sessions: [],
    }
  }
}
