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

    // Fetch products from Shopify
    const productsData = await fetchProductsByVendor(vendorName)
    const totalProducts = productsData.products.length
    console.log(`Found ${totalProducts} products for vendor ${vendorName}`)

    // Simple direct query to get all active line items for this vendor
    const { data: lineItems, error } = await supabaseAdmin
      .from("order_line_items")
      .select("*")
      .eq("vendor_name", vendorName)
      .eq("status", "active")

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Count certified items and calculate revenue
    const certifiedItems = lineItems.filter((item) => item.edition_number)
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
      return NextResponse.json({ error: payoutsError.message }, { status: 500 })
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
