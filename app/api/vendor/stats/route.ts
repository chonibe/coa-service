import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { shopifyFetch, safeJsonParse } from "@/lib/shopify-api"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Get the vendor name from the cookie
    const cookieStore = cookies()
    const vendorName = cookieStore.get("vendor_session")?.value

    if (!vendorName) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    // Fetch products by vendor from Shopify
    const productsData = await fetchProductsByVendor(vendorName)

    // Calculate stats
    const totalProducts = productsData.products.length

    // Fetch sales data from Supabase
    const { data: salesData, error: salesError } = await supabaseAdmin
      .from("product_edition_counters")
      .select("product_id, current_edition_number, edition_total")

    if (salesError) {
      console.error("Error fetching sales data from Supabase:", salesError)
      throw new Error("Failed to fetch sales data from Supabase")
    }

    // Filter sales data for the current vendor's products
    const vendorProductIds = productsData.products.map((product) => product.id)
    const vendorSalesData = salesData.filter((item) => vendorProductIds.includes(item.product_id))

    // Calculate total sales and total revenue
    let totalSales = 0
    let totalRevenue = 0

    for (const item of vendorSalesData) {
      // Assuming each unit sold is 1 sale
      const unitsSold = item.current_edition_number ? item.current_edition_number - 1 : 0
      totalSales += unitsSold

      // Find the product price
      const product = productsData.products.find((p) => p.id === item.product_id)
      if (product) {
        totalRevenue += unitsSold * Number.parseFloat(product.price)
      }
    }

    const pendingPayout = 0

    return NextResponse.json({
      totalProducts,
      totalSales,
      totalRevenue,
      pendingPayout,
    })
  } catch (error: any) {
    console.error("Error in vendor stats API:", error)
    return NextResponse.json({ message: error.message || "An error occurred" }, { status: 500 })
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
