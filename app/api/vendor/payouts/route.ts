import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    // Get vendor name from cookie
    const cookieStore = await cookies()
    const vendorSession = cookieStore.get("vendor_session")
    const vendorName = vendorSession?.value

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
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

    // If no payouts found, calculate pending payout from order_line_items_v2
    const { data: lineItems, error: lineItemsError } = await supabaseAdmin
      .from("order_line_items_v2")
      .select("*")
      .eq("vendor_name", vendorName)
      .eq("status", "active")

    if (lineItemsError) {
      console.error("Error fetching line items:", lineItemsError)
      return NextResponse.json({ error: "Failed to fetch line items" }, { status: 500 })
    }

    // Get the vendor's products and their payout settings
    const { data: payoutSettings, error: payoutSettingsError } = await supabaseAdmin
      .from("product_vendor_payouts")
      .select("*")
      .eq("vendor_name", vendorName)

    if (payoutSettingsError) {
      console.error("Error fetching payout settings:", payoutSettingsError)
      return NextResponse.json({ error: "Failed to fetch payout settings" }, { status: 500 })
    }

    // Calculate pending payout
    let pendingAmount = 0
    const salesData = lineItems || []
    const processedItems = new Set()

    salesData.forEach((item) => {
      // Skip if this item has already been processed
      if (processedItems.has(item.line_item_id)) {
        return
      }
      processedItems.add(item.line_item_id)

      const payout = payoutSettings?.find((p) => p.product_id === item.product_id)
      const price = typeof item.price === "string" ? Number.parseFloat(item.price || "0") : item.price || 0
      const quantity = item.quantity || 1

      let itemPayout
      if (payout) {
        if (payout.is_percentage) {
          itemPayout = (price * payout.payout_amount / 100) * quantity
        } else {
          itemPayout = payout.payout_amount * quantity
        }
      } else {
        // Default payout if no specific setting found (20%)
        itemPayout = (price * 0.2) * quantity
      }

      pendingAmount += itemPayout
    })

    // Create a mock pending payout
    const mockPayouts = [
      {
        id: "pending",
        amount: pendingAmount,
        status: "pending",
        date: new Date().toISOString().split("T")[0],
        products: processedItems.size,
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
