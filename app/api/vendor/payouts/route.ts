import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    // Get vendor name from cookie
    const cookieStore = cookies()
    const vendorName = cookieStore.get("vendor_session")?.value

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log(`Fetching payouts for vendor: ${vendorName}`)

    // First try to get payouts from the vendor_payouts table
    const { data: payouts, error } = await supabaseAdmin
      .from("vendor_payouts")
      .select("*")
      .eq("vendor_name", vendorName)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching vendor payouts:", error)
    }

    // If we have payouts data, format and return it
    if (payouts && payouts.length > 0) {
      const formattedPayouts = payouts.map((payout) => ({
        id: payout.id,
        amount: payout.amount,
        status: payout.status,
        date: payout.payout_date || payout.created_at,
        products: payout.product_count || 0,
        reference: payout.reference,
      }))

      return NextResponse.json({ payouts: formattedPayouts })
    }

    // If no payouts found, calculate pending payout from sales data
    // First get the vendor's sales data
    const { data: lineItems } = await supabaseAdmin
      .from("order_line_items")
      .select("*")
      .eq("vendor_name", vendorName)
      .eq("status", "active")

    // Get the vendor's products
    const { products } = await fetchProductsByVendor(vendorName)
    const productIds = products.map((p) => p.id)

    // Get payout settings
    const { data: payoutSettings } = await supabaseAdmin
      .from("product_vendor_payouts")
      .select("*")
      .eq("vendor_name", vendorName)
      .in("product_id", productIds)

    // Calculate pending payout
    let pendingAmount = 0
    const salesData = lineItems || []

    salesData.forEach((item) => {
      const payout = payoutSettings?.find((p) => p.product_id === item.product_id)
      if (payout) {
        const price = typeof item.price === "string" ? Number.parseFloat(item.price || "0") : item.price || 0

        if (payout.is_percentage) {
          pendingAmount += (price * payout.payout_amount) / 100
        } else {
          pendingAmount += payout.payout_amount
        }
      } else {
        // Default payout if no specific setting found (10%)
        const price = typeof item.price === "string" ? Number.parseFloat(item.price || "0") : item.price || 0
        pendingAmount += price * 0.1 // 10% default
      }
    })

    // Create a mock pending payout
    const mockPayouts = [
      {
        id: "pending",
        amount: pendingAmount,
        status: "pending",
        date: new Date().toISOString().split("T")[0],
        products: salesData.length,
        reference: "Pending Payout",
      },
    ]

    return NextResponse.json({ payouts: mockPayouts })
  } catch (error) {
    console.error("Unexpected error in vendor payouts API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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
            }
          }
        }
      }
    `

    // Make the request to Shopify
    const response = await fetch(`https://${process.env.SHOPIFY_SHOP}/admin/api/2023-10/graphql.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN as string,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: graphqlQuery }),
    })

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (!data || !data.data || !data.data.products) {
      throw new Error("Invalid response from Shopify GraphQL API")
    }

    // Extract products
    const products = data.data.products.edges.map((edge: any) => {
      const product = edge.node
      return {
        id: product.id.split("/").pop(),
        title: product.title,
        handle: product.handle,
        vendor: product.vendor,
        productType: product.productType,
        inventory: product.totalInventory,
        price: product.priceRangeV2.minVariantPrice.amount,
        currency: product.priceRangeV2.minVariantPrice.currencyCode,
      }
    })

    return { products }
  } catch (error) {
    console.error("Error fetching products by vendor:", error)
    throw error
  }
}
