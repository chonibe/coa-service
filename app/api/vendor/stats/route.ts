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

    // Fetch line items with active certificates for this vendor
    const { data: lineItems, error: lineItemsError } = await supabaseAdmin
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
        status
      `)
      .eq("vendor_name", vendorName)
      .eq("status", "active")
      .not("edition_number", "is", null)

    if (lineItemsError) {
      console.error("Error fetching line items:", lineItemsError)
      return NextResponse.json(
        {
          message: "Failed to fetch line items",
          error: lineItemsError,
        },
        { status: 500 },
      )
    }

    // Count sales and calculate revenue
    const totalSales = lineItems.length
    const totalRevenue = lineItems.reduce((sum, item) => {
      const price = typeof item.price === "string" ? Number.parseFloat(item.price || "0") : item.price || 0
      return sum + price
    }, 0)

    // Fetch payout settings for these products
    const productIds = productsData.products.map((product) => product.id)
    const { data: payouts, error: payoutsError } = await supabaseAdmin
      .from("product_vendor_payouts")
      .select("product_id, payout_amount, is_percentage")
      .eq("vendor_name", vendorName)
      .in("product_id", productIds)

    if (payoutsError) {
      console.error("Error fetching vendor payouts:", payoutsError)
      return NextResponse.json(
        {
          message: "Failed to fetch vendor payouts",
          error: payoutsError,
        },
        { status: 500 },
      )
    }

    // Calculate pending payout based on line items
    let pendingPayout = 0

    for (const item of lineItems) {
      const productId = item.product_id
      const price = typeof item.price === "string" ? Number.parseFloat(item.price || "0") : item.price || 0
      const payout = payouts?.find((p) => p.product_id === productId)

      if (payout) {
        if (payout.is_percentage) {
          pendingPayout += (price * payout.payout_amount) / 100
        } else {
          pendingPayout += payout.payout_amount
        }
      }
    }

    return NextResponse.json({
      totalProducts,
      totalSales,
      totalRevenue,
      pendingPayout,
    })
  } catch (error: any) {
    console.error("Error in vendor stats API:", error)
    return NextResponse.json(
      {
        message: error.message || "An error occurred",
        stack: error.stack,
      },
      { status: 500 },
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
      }
    })

    return { products }
  } catch (error) {
    console.error("Error fetching products by vendor:", error)
    throw error
  }
}
