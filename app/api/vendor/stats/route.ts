import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { shopifyFetch, safeJsonParse } from "@/lib/shopify-api"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { getUsdBalance, calculateUnifiedCollectorBalance } from "@/lib/banking/balance-calculator"
import { ensureCollectorAccount } from "@/lib/banking/account-manager"

const DEFAULT_CURRENCY = "USD"
const DEFAULT_PAYOUT_PERCENTAGE = 25
const HISTORICAL_PRICE = 40.00
const HISTORICAL_PAYOUT = 10.00
const OCTOBER_2025 = new Date('2025-10-01')
const RECENT_ACTIVITY_LIMIT = 5
const CHART_WINDOW = 30

export async function GET() {
  const supabase = createClient()
  
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const [{ products }, lineItemsResult] = await Promise.all([
      fetchProductsByVendor(vendorName),
      supabase
        .from("order_line_items_v2")
        .select("id, product_id, price, quantity, created_at, status, vendor_name, fulfillment_status")
      .eq("vendor_name", vendorName)
        .eq("status", "active"),
    ])

    if (lineItemsResult.error) {
      console.error("Database error when fetching vendor line items:", lineItemsResult.error)
      return NextResponse.json({ error: "Failed to fetch vendor stats" }, { status: 500 })
    }

    let lineItems = lineItemsResult.data ?? []

    const productIds = Array.from(new Set(lineItems.map((item) => item.product_id).filter(Boolean)))
    const payoutSettings = productIds.length
      ? await fetchPayoutSettings(supabase, vendorName, productIds)
      : []

    // Fallback to Shopify orders if Supabase has no data yet
    if (lineItems.length === 0) {
      try {
        lineItems = await fetchVendorOrdersFromShopify(vendorName)
      } catch (shopifyError) {
        console.error("Shopify fallback failed:", shopifyError)
      }
    }

    const stats = buildFinancialSummary(lineItems, payoutSettings)

    // Get unified balance from collector ledger (single source of truth)
    let totalPayout = stats.totalPayout // Fallback to calculated value
    let totalUsdEarned = 0
    let currentUsdBalance = 0
    
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
        
        // Get unified balance from ledger
        const unifiedBalance = await calculateUnifiedCollectorBalance(collectorIdentifier)
        totalUsdEarned = unifiedBalance.totalUsdEarned
        currentUsdBalance = unifiedBalance.usdBalance
        
        // Use total USD earned as totalPayout (all-time earnings)
        totalPayout = totalUsdEarned
      }
    } catch (error) {
      console.error("Error fetching collector balance for stats:", error)
      // Fall back to calculated value if ledger lookup fails
    }

    return NextResponse.json({
      totalProducts: products.length,
      totalSales: stats.totalSales,
      totalRevenue: stats.totalRevenue,
      totalPayout: totalPayout, // Now from collector ledger
      currentUsdBalance: currentUsdBalance, // Available balance
      totalUsdEarned: totalUsdEarned, // All-time earnings
      pendingFulfillmentCount: stats.pendingFulfillmentCount,
      pendingFulfillmentRevenue: stats.pendingFulfillmentRevenue,
      currency: stats.currency,
      salesByDate: stats.salesByDate,
      recentActivity: stats.recentActivity,
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
          const lineItemId = lineItem.id.split("/").pop()
          vendorLineItems.push({
            id: lineItemId,
            line_item_id: lineItemId,
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

async function fetchPayoutSettings(
  supabase: ReturnType<typeof createClient>,
  vendorName: string,
  productIds: string[],
) {
  const { data, error } = await supabase
    .from("product_vendor_payouts")
    .select("product_id, payout_amount, is_percentage")
    .eq("vendor_name", vendorName)
    .in("product_id", productIds)

  if (error) {
    console.error("Error fetching payout settings:", error)
    return []
  }

  return data ?? []
}

const normalisePrice = (price: unknown): number => {
  if (typeof price === "number") return price
  if (typeof price === "string") {
    const parsed = Number.parseFloat(price)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const normaliseQuantity = (quantity: unknown): number => {
  if (typeof quantity === "number" && Number.isFinite(quantity)) {
    return quantity
  }
  if (typeof quantity === "string") {
    const parsed = Number.parseInt(quantity, 10)
    return Number.isFinite(parsed) ? parsed : 1
  }
  return 1
}

const normaliseDateKey = (value: unknown): string => {
  const date = value instanceof Date ? value : new Date(value as string)
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().split("T")[0]
  }
  return date.toISOString().split("T")[0]
}

const buildFinancialSummary = (
  lineItems: Array<{
    id?: string
    created_at?: string
    product_id?: string
    price?: number | string | null
    quantity?: number | string | null
  }>,
  payoutSettings: Array<{
    product_id: string
    payout_amount: number | string | null
    is_percentage: boolean | null
  }>,
) => {
  const payoutMap = new Map(
    payoutSettings.map((setting) => [
      setting.product_id,
      {
        amount: typeof setting.payout_amount === "string"
          ? Number.parseFloat(setting.payout_amount)
          : setting.payout_amount ?? 0,
        isPercentage: Boolean(setting.is_percentage),
      },
    ]),
  )

  const salesByDate = new Map<string, { sales: number; revenue: number }>()
  const recentActivity = []

  let totalSales = 0
  let totalRevenue = 0
  let totalPayout = 0
  let pendingFulfillmentCount = 0
  let pendingFulfillmentRevenue = 0

  for (const item of lineItems) {
    // 1. Completely exclude items that are cancelled or restocked
    if (item.status === 'cancelled' || (item as any).restocked === true) {
      continue
    }

    const quantity = normaliseQuantity(item.quantity)
    const createdAt = item.created_at ? new Date(item.created_at) : new Date()
    let unitPrice = normalisePrice(item.price)
    const gross = unitPrice * quantity

    // 2. Handle Unfulfilled (Pending Fulfillment)
    if (item.fulfillment_status !== 'fulfilled') {
      pendingFulfillmentCount += quantity
      pendingFulfillmentRevenue += gross
      
      // Still show in recent activity but don't count towards main metrics
      recentActivity.push({
        id: item.id ?? `activity-${recentActivity.length}`,
        date: item.created_at ?? new Date().toISOString(),
        product_id: item.product_id ?? "",
        price: unitPrice,
        quantity,
        isPendingFulfillment: true
      })
      continue
    }

    // 3. Main Metrics (Fulfilled)
    let vendorShare = 0

    // Apply historical adjustment: Pre-Oct 2025 items are $40 revenue / $10 payout
    if (createdAt < OCTOBER_2025) {
      unitPrice = HISTORICAL_PRICE
      vendorShare = HISTORICAL_PAYOUT * quantity
    } else {
      const payout = payoutMap.get(item.product_id ?? "")
      
      if (payout) {
        vendorShare = payout.isPercentage ? gross * (payout.amount / 100) : payout.amount * quantity
      } else {
        vendorShare = gross * (DEFAULT_PAYOUT_PERCENTAGE / 100)
      }
    }

    const recalculatedGross = unitPrice * quantity
    totalSales += quantity
    totalRevenue += recalculatedGross
    totalPayout += vendorShare

    const dateKey = normaliseDateKey(item.created_at)
    const existing = salesByDate.get(dateKey) ?? { sales: 0, revenue: 0 }
    existing.sales += quantity
    existing.revenue += recalculatedGross
    salesByDate.set(dateKey, existing)

    recentActivity.push({
      id: item.id ?? `activity-${recentActivity.length}`,
      date: item.created_at ?? new Date().toISOString(),
      product_id: item.product_id ?? "",
      price: unitPrice,
      quantity,
      isPendingFulfillment: false
    })
  }

  const chartData = Array.from(salesByDate.entries())
    .map(([date, stats]) => ({
      date,
      sales: stats.sales,
      revenue: Number(stats.revenue.toFixed(2)),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-CHART_WINDOW)

  const activity = recentActivity
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, RECENT_ACTIVITY_LIMIT)

  return {
    totalSales,
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalPayout: Number(totalPayout.toFixed(2)),
    pendingFulfillmentCount,
    pendingFulfillmentRevenue: Number(pendingFulfillmentRevenue.toFixed(2)),
    currency: DEFAULT_CURRENCY,
    salesByDate: chartData,
    recentActivity: activity,
  }
}
