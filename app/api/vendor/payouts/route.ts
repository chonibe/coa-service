import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { getUsdBalance, calculateUnifiedCollectorBalance } from "@/lib/banking/balance-calculator"
import { ensureCollectorAccount } from "@/lib/banking/account-manager"

export async function GET() {
  const supabase = createClient()
  
  try {
    // Get vendor name from cookie
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log(`Fetching payouts for vendor: ${vendorName}`)

    // First try to get payouts from the vendor_payouts table
    const { data: payouts, error } = await supabase
      .from("vendor_payouts")
      .select("*")
      .eq("vendor_name", vendorName)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching vendor payouts:", error)
    }

    // If we have payouts data, format and return it with items
    if (payouts && payouts.length > 0) {
      const formattedPayouts = await Promise.all(
        payouts.map(async (payout) => {
          // Get payout items with product details and payment reference
          const { data: payoutItems, error: itemsError } = await supabase
            .from("vendor_payout_items")
            .select(`
              line_item_id,
              amount,
              payout_reference,
              marked_at,
              marked_by,
              order_line_items_v2 (
                name,
                created_at,
                product_id
              )
            `)
            .eq("payout_id", payout.id)

          // Get product names
          const items = await Promise.all(
            (payoutItems || []).map(async (item: any) => {
              const lineItem = item.order_line_items_v2
              if (!lineItem) return null

              // Get product name
              const { data: product } = await supabase
                .from("products")
                .select("name, product_id")
                .or(`product_id.eq.${lineItem.product_id},id.eq.${lineItem.product_id}`)
                .maybeSingle()

              return {
                item_name: product?.name || lineItem.name || `Product ${lineItem.product_id}`,
                date: lineItem.created_at,
                amount: item.amount,
                payout_reference: item.payout_reference || payout.reference,
                marked_at: item.marked_at,
                marked_by: item.marked_by,
                is_paid: true,
              }
            })
          )

          return {
            id: payout.id,
            amount: payout.amount,
            status: payout.status,
            date: payout.payout_date || payout.created_at,
            products: payout.product_count || 0,
            reference: payout.reference,
            invoice_number: payout.invoice_number,
            payout_batch_id: payout.payout_batch_id,
            items: items.filter((item) => item !== null),
          }
        })
      )

      return NextResponse.json({ payouts: formattedPayouts })
    }

    // If no payouts found, get pending amount from collector ledger (single source of truth)
    let pendingAmount = 0
    
    try {
      // Get vendor's collector identifier
      const { data: vendor } = await supabase
        .from("vendors")
        .select("id, auth_id, vendor_name")
        .eq("vendor_name", vendorName)
        .single()

      if (vendor) {
        const collectorIdentifier = vendor.auth_id || vendorName
        await ensureCollectorAccount(collectorIdentifier, 'vendor', vendor.id)
        
        // Get current USD balance from ledger (this is what's available to request)
        pendingAmount = await getUsdBalance(collectorIdentifier)
      }
    } catch (error) {
      console.error("Error fetching collector balance for payouts:", error)
      // If ledger lookup fails, fall back to old calculation method
      const { data: paidItems } = await supabase
        .from("vendor_payout_items")
        .select("line_item_id")
        .not("payout_id", "is", null)
      
      const paidLineItemIds = new Set((paidItems || []).map((item: any) => item.line_item_id))
      
      const { data: lineItems } = await supabase
        .from("order_line_items_v2")
        .select("*")
        .eq("vendor_name", vendorName)
        .eq("fulfillment_status", "fulfilled")

      const { products } = await fetchProductsByVendor(vendorName)
      const productIds = products.map((p) => p.id)

      const { data: payoutSettings } = await supabase
        .from("product_vendor_payouts")
        .select("*")
        .eq("vendor_name", vendorName)
        .in("product_id", productIds)

      const unpaidItems = (lineItems || []).filter((item: any) => !paidLineItemIds.has(item.line_item_id))
      const salesData = unpaidItems

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
          const price = typeof item.price === "string" ? Number.parseFloat(item.price || "0") : item.price || 0
          pendingAmount += price * 0.25
        }
      })
    }

    // Create a mock pending payout with balance from ledger
    const mockPayouts = [
      {
        id: "pending",
        amount: pendingAmount,
        status: "pending",
        date: new Date().toISOString().split("T")[0],
        products: 0, // We don't track product count in ledger, so set to 0
        reference: "Available Balance",
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
