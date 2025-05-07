import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { shopifyFetch, safeJsonParse } from "@/lib/shopify-api"
import { supabaseAdmin } from "@/lib/supabase"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    let vendor = searchParams.get("vendor")

    // If no vendor provided in query, try to get from cookie
    if (!vendor) {
      const cookieStore = cookies()
      vendor = cookieStore.get("vendor_session")?.value
    }

    if (!vendor) {
      return NextResponse.json(
        { error: "No vendor specified" },
        { status: 400 }
      )
    }

    console.log(`Fetching products for vendor: ${vendor}`)

    try {
      // Fetch products for this vendor
      const { products } = await fetchProductsByVendor(vendor)

      // Fetch payout settings for these products
      const productIds = products.map((p) => p.id)
      const { data: payouts, error: payoutsError } = await supabaseAdmin
        .from("product_vendor_payouts")
        .select("product_id, payout_amount, is_percentage")
        .eq("vendor_name", vendor)
        .in("product_id", productIds)

      if (payoutsError) {
        console.error("Error fetching vendor payouts:", payoutsError)
        return NextResponse.json(
          { error: "Failed to fetch vendor payout settings" },
          { status: 500 }
        )
      }

      // Merge payout settings with product data
      const productsWithPayouts = products.map((product) => {
        const payout = payouts?.find((p) => p.product_id === product.id)
        return {
          ...product,
          payout_amount: payout?.payout_amount || 0,
          is_percentage: payout?.is_percentage || false,
        }
      })

      return NextResponse.json({ products: productsWithPayouts })
    } catch (shopifyError) {
      console.error("Error fetching from Shopify:", shopifyError)
      return NextResponse.json(
        { error: "Failed to fetch products from Shopify" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error fetching vendor products:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    )
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
        status: "active", // Default status
      }
    })

    return { products }
  } catch (error) {
    console.error("Error fetching products by vendor:", error)
    throw error
  }
}
