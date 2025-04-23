import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "@/lib/shopify-api"
import { shopifyFetch, safeJsonParse } from "@/lib/shopify-api"

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

    let totalSales = 0
    let totalRevenue = 0

    for (const product of productsData.products) {
      // Fetch sales data for each product from Shopify
      const productSalesData = await fetchProductSalesFromShopify(product.id)
      totalSales += productSalesData.totalSales
      totalRevenue += productSalesData.totalRevenue
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
    const products = data.data.products.edges.map((edge: any) => edge.node)

    return { products }
  } catch (error) {
    console.error("Error fetching products by vendor:", error)
    throw error
  }
}

async function fetchProductSalesFromShopify(productId: string) {
  try {
    // Build the GraphQL query to fetch product sales data
    const graphqlQuery = `
      {
        product(id: "gid://shopify/Product/${productId}") {
          totalSales: totalInventory
        }
      }
    `

    // Make the request to Shopify
    const response = await shopifyFetch("graphql.json", {
      method: "POST",
      body: JSON.stringify({ query: graphqlQuery }),
    })

    const data = await safeJsonParse(response)

    if (!data || !data.data || !data.data.product) {
      console.error("Invalid response from Shopify GraphQL API:", data)
      throw new Error("Invalid response from Shopify GraphQL API")
    }

    const product = data.data.product
    const totalSales = product.totalSales || 0
    const productPrice = 100 //product.priceRangeV2.minVariantPrice.amount || 0
    const totalRevenue = totalSales * productPrice

    return { totalSales, totalRevenue }
  } catch (error) {
    console.error("Error fetching product sales from Shopify:", error)
    return { totalSales: 0, totalRevenue: 0 }
  }
}
