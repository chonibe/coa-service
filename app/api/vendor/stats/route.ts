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
      .from("order_line_items")
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

    console.log("Starting revenue calculation...")
    salesData.forEach((item) => {
      console.log("Processing item:", {
        id: item.id,
        price: item.price,
        quantity: item.quantity,
        price_type: typeof item.price
      })
      
      if (item.price) {
        const price = typeof item.price === "string" ? Number.parseFloat(item.price) : item.price
        const quantity = item.quantity || 1
        const itemRevenue = price * quantity
        totalRevenue += itemRevenue
        console.log(`Item revenue: $${itemRevenue.toFixed(2)} (price: $${price.toFixed(2)} x quantity: ${quantity})`)
      } else {
        console.log("Item has no price:", item)
      }
    })
    console.log(`Total revenue calculated: $${totalRevenue.toFixed(2)}`)

    // 4. If no data from database, try fetching from Shopify as fallback
    if (salesData.length === 0) {
      console.log("No sales data in database, fetching from Shopify")
      try {
        const shopifyOrders = await fetchVendorOrdersFromShopify(vendorName)
        if (shopifyOrders && shopifyOrders.length > 0) {
          salesData = shopifyOrders
          totalSales = shopifyOrders.length

          // Recalculate revenue from Shopify data
          totalRevenue = 0
          shopifyOrders.forEach((item) => {
            if (item.price) {
              const price = typeof item.price === "string" ? Number.parseFloat(item.price) : item.price
              const quantity = item.quantity || 1
              totalRevenue += price * quantity
            }
          })

          console.log(`Found ${totalSales} orders from Shopify with revenue $${totalRevenue.toFixed(2)}`)
        }
      } catch (shopifyError) {
        console.error("Error fetching from Shopify:", shopifyError)
      }
    }

    // 5. Fetch payout settings to calculate pending payout
    const productIds = products.map((p) => p.id)
    const { data: payouts, error: payoutsError } = await supabaseAdmin
      .from("product_vendor_payouts")
      .select("*")
      .eq("vendor_name", vendorName)
      .in("product_id", productIds)

    if (payoutsError) {
      console.error("Error fetching payouts:", payoutsError)
    }

    // 6. Calculate pending payout based on sales and payout settings
    let pendingPayout = 0
    salesData.forEach((item) => {
      const payout = payouts?.find((p) => p.product_id === item.product_id)
      if (payout) {
        const price = typeof item.price === "string" ? Number.parseFloat(item.price || "0") : item.price || 0

        if (payout.is_percentage) {
          pendingPayout += (price * payout.payout_amount) / 100
        } else {
          pendingPayout += payout.payout_amount
        }
      } else {
        // Default payout if no specific setting found (10%)
        const price = typeof item.price === "string" ? Number.parseFloat(item.price || "0") : item.price || 0
        pendingPayout += price * 0.1 // 10% default
      }
    })

    console.log(`Calculated pending payout: $${pendingPayout.toFixed(2)}`)

    return NextResponse.json({
      totalProducts,
      totalSales,
      totalRevenue: Number.parseFloat(totalRevenue.toFixed(2)),
      pendingPayout: Number.parseFloat(pendingPayout.toFixed(2)),
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
