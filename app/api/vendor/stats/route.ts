import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabaseAdmin } from "@/lib/supabase"
import { shopifyFetch, safeJsonParse } from "@/lib/shopify-api"

export async function GET() {
  try {
    // Get vendor name from cookie
    const cookieStore = cookies()
    const vendorName = cookieStore.get("vendor_session")?.value

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log(`Fetching stats for vendor: ${vendorName}`)

    // 1. Fetch products from Shopify to get accurate product count
    const { products } = await fetchProductsByVendor(vendorName)
    const totalProducts = products.length
    console.log(`Found ${totalProducts} products for vendor ${vendorName}`)

    // 2. Query for line items from this vendor in our database
    const { data: lineItems, error } = await supabaseAdmin
      .from("order_line_items_v2")
      .select("*")
      .eq("vendor_name", vendorName)
      .eq("status", "active")

    if (error) {
      console.error("Database error when fetching line items:", error)
    }

    console.log(`Found ${lineItems?.length || 0} active line items for vendor ${vendorName}`)
    if (lineItems && lineItems.length > 0) {
      console.log("Sample line item:", JSON.stringify(lineItems[0], null, 2))
    }

    // 3. Calculate sales and revenue from line items
    let salesData = lineItems || []
    let totalSales = salesData.length
    let totalRevenue = 0

    // First fetch payout settings
    const productIds = products.map((p) => p.id)
    const { data: payouts, error: payoutsError } = await supabaseAdmin
      .from("product_vendor_payouts")
      .select("*")
      .eq("vendor_name", vendorName)
      .in("product_id", productIds)

    if (payoutsError) {
      console.error("Error fetching payouts:", payoutsError)
    }

    // Process sales by date for chart data
    const salesByDate: Record<string, { sales: number; revenue: number }> = {}
    
    console.log("Starting revenue calculation...")
    salesData.forEach((item) => {
      console.log("Processing item:", {
        id: item.id,
        product_id: item.product_id,
        price: item.price,
        quantity: item.quantity
      })
      
      // Format created_at date to YYYY-MM-DD for chart data
      const dateStr = new Date(item.created_at).toISOString().split("T")[0]
      if (!salesByDate[dateStr]) {
        salesByDate[dateStr] = { sales: 0, revenue: 0 }
      }
      
      const payout = payouts?.find((p) => p.product_id === item.product_id)
      const price = typeof item.price === "string" ? Number.parseFloat(item.price || "0") : item.price || 0
      const quantity = item.quantity || 1
      
      let itemRevenue
      if (payout) {
        if (payout.is_percentage) {
          itemRevenue = (price * payout.payout_amount / 100) * quantity
        } else {
          itemRevenue = payout.payout_amount * quantity
        }
      } else {
        // Default payout if no specific setting found (20%)
        itemRevenue = (price * 0.2) * quantity
      }
      
      totalRevenue += itemRevenue
      salesByDate[dateStr].sales += quantity
      salesByDate[dateStr].revenue += itemRevenue
      
      console.log(`Item revenue: £${itemRevenue.toFixed(2)} (payout: ${payout ? (payout.is_percentage ? payout.payout_amount + '%' : '£' + payout.payout_amount) : '20% default'} x price: £${price.toFixed(2)} x quantity: ${quantity})`)
    })
    console.log(`Total revenue calculated: £${totalRevenue.toFixed(2)}`)

    // 4. If no data from database, try fetching from Shopify as fallback
    if (salesData.length === 0) {
      console.log("No sales data in database, fetching from Shopify")
      try {
        const shopifyOrders = await fetchVendorOrdersFromShopify(vendorName)
        if (shopifyOrders && shopifyOrders.length > 0) {
          salesData = shopifyOrders
          totalSales = shopifyOrders.length

          // Recalculate revenue from Shopify data using payout settings
          totalRevenue = 0
          shopifyOrders.forEach((item) => {
            const dateStr = new Date(item.created_at).toISOString().split("T")[0]
            if (!salesByDate[dateStr]) {
              salesByDate[dateStr] = { sales: 0, revenue: 0 }
            }
            
            const payout = payouts?.find((p) => p.product_id === item.product_id)
            const price = typeof item.price === "string" ? Number.parseFloat(item.price || "0") : item.price || 0
            const quantity = item.quantity || 1
            
            let itemRevenue
            if (payout) {
              if (payout.is_percentage) {
                itemRevenue = (price * payout.payout_amount / 100) * quantity
              } else {
                itemRevenue = payout.payout_amount * quantity
              }
            } else {
              // Default payout if no specific setting found (20%)
              itemRevenue = (price * 0.2) * quantity
            }
            
            totalRevenue += itemRevenue
            salesByDate[dateStr].sales += quantity
            salesByDate[dateStr].revenue += itemRevenue
          })

          console.log(`Found ${totalSales} orders from Shopify with revenue £${totalRevenue.toFixed(2)}`)
        }
      } catch (shopifyError) {
        console.error("Error fetching from Shopify:", shopifyError)
      }
    }

    // Calculate pending payout (this is now the same as total revenue)
    const pendingPayout = totalRevenue

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

    // Format recent activity data
    const recentActivity = salesData
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(item => ({
        id: item.id,
        date: item.created_at,
        product_id: item.product_id,
        price: typeof item.price === "string" ? Number.parseFloat(item.price || "0") : item.price || 0,
        quantity: item.quantity || 1
      }))

    console.log(`Final calculations - Total Sales: ${totalSales}, Total Revenue: £${totalRevenue.toFixed(2)}, Pending Payout: £${pendingPayout.toFixed(2)}`)
    console.log(`Recent activity items: ${recentActivity.length}`)
    console.log('Recent activity dates:', recentActivity.map(item => new Date(item.date).toISOString()))

    return NextResponse.json({
      totalProducts,
      totalSales,
      totalRevenue: Number.parseFloat(totalRevenue.toFixed(2)),
      pendingPayout: Number.parseFloat(pendingPayout.toFixed(2)),
      salesByDate: last30Days,
      recentActivity
    })
  } catch (error) {
    console.error("Unexpected error in vendor stats API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
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
        vendor_name: product.vendor,
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
    const response = await shopifyFetch("graphql.json", {
      method: "POST",
      body: JSON.stringify({ query: graphqlQuery }),
    })

    const data = await safeJsonParse(response)

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
