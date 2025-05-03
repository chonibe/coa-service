import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabaseAdmin } from "@/lib/supabase"
import { shopifyFetch, safeJsonParse } from "@/lib/shopify-api"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"

export async function GET() {
  try {
    // Get vendor name from cookie
    const cookieStore = cookies()
    const vendorName = cookieStore.get("vendor_session")?.value

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log(`Fetching stats for vendor: ${vendorName}`)

    // Fetch products from Shopify
    const productsData = await fetchProductsByVendor(vendorName)
    const totalProducts = productsData.products.length
    console.log(`Found ${totalProducts} products for vendor ${vendorName}`)

    // Query for line items from this vendor
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

    // Count certified items and calculate revenue
    const certifiedItems = salesData.filter((item) => item.edition_number || item.status === "active")
    const totalSales = certifiedItems.length

    let totalRevenue = 0
    certifiedItems.forEach((item) => {
      if (item.price) {
        const price = typeof item.price === "string" ? Number.parseFloat(item.price) : item.price
        totalRevenue += price
      }
    })

    console.log(`Found ${totalSales} certified items with total revenue $${totalRevenue.toFixed(2)}`)

    // Fetch payout settings
    const productIds = productsData.products.map((p) => p.id)
    const { data: payouts, error: payoutsError } = await supabaseAdmin
      .from("product_vendor_payouts")
      .select("*")
      .eq("vendor_name", vendorName)
      .in("product_id", productIds)

    if (payoutsError) {
      console.error("Error fetching payouts:", payoutsError)
      // Continue with default values
    }

    // Calculate pending payout
    let pendingPayout = 0
    certifiedItems.forEach((item) => {
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
      totalRevenue,
      pendingPayout,
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
