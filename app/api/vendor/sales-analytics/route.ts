import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"

const DEFAULT_CURRENCY = "GBP"

type SupabaseLineItem = {
  id?: string
  product_id?: string
  name?: string
  created_at?: string
  price?: number | string | null
  quantity?: number | string | null
  status?: string | null
  img_url?: string | null
}

type ProductDetail = {
  id: string
  title?: string | null
  img_url?: string | null
}

type PayoutSetting = {
  product_id: string
  payout_amount: number | string | null
  is_percentage: boolean | null
}

export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get date range from query parameters
    const searchParams = request.nextUrl.searchParams
    const timeRange = searchParams.get("range") || "30d"
    const fromDate = searchParams.get("from")
    const toDate = searchParams.get("to")

    // Calculate date range based on timeRange or custom dates
    let startDate: Date | null = null
    let endDate: Date | null = null

    if (fromDate && toDate) {
      startDate = new Date(fromDate)
      endDate = new Date(toDate)
    } else {
      endDate = new Date()
      switch (timeRange) {
        case "7d":
          startDate = new Date()
          startDate.setDate(startDate.getDate() - 7)
          break
        case "30d":
          startDate = new Date()
          startDate.setDate(startDate.getDate() - 30)
          break
        case "90d":
          startDate = new Date()
          startDate.setDate(startDate.getDate() - 90)
          break
        case "1y":
          startDate = new Date()
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
        default:
          // Default to 30 days
          startDate = new Date()
          startDate.setDate(startDate.getDate() - 30)
      }
    }

    // Build query with date filtering
    let query = supabase
      .from("order_line_items_v2")
      .select("id, product_id, name, created_at, price, quantity, status, img_url")
      .eq("vendor_name", vendorName)
      .eq("status", "active")

    // Add date filtering if dates are provided
    if (startDate && endDate) {
      query = query
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
    }

    const { data: lineItems, error } = await query

    if (error) {
      console.error("Database error when fetching line items:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    const items = lineItems ?? []
    const productIds = Array.from(new Set(items.map((item) => item.product_id).filter(Boolean)))

    // Fetch product details (name and image) from products table
    const productDetails = await fetchProductDetails(supabase, productIds)

    const payoutSettings: PayoutSetting[] = productIds.length
      ? await fetchPayoutSettings(supabase, vendorName, productIds)
      : []

    const analytics = buildAnalytics(items, payoutSettings, productDetails)

    return NextResponse.json({
      salesByDate: analytics.salesByDate,
      salesByProduct: analytics.salesByProduct,
      salesHistory: analytics.salesHistory,
      totalItems: items.length,
    })
  } catch (error) {
    console.error("Unexpected error in vendor sales analytics API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
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

async function fetchProductDetails(
  supabase: ReturnType<typeof createClient>,
  productIds: string[],
): Promise<Map<string, ProductDetail>> {
  if (productIds.length === 0) {
    return new Map()
  }

  try {
    // Try to fetch from products table first
    // Use product_id to match (not id) and name instead of title
    const { data: products, error } = await supabase
      .from("products")
      .select("product_id, name, img_url")
      .in("product_id", productIds.map(id => id.toString()))

    if (error) {
      console.error("Error fetching product details:", error)
      return new Map()
    }

    const productMap = new Map<string, ProductDetail>()
    products?.forEach((product) => {
      if (product.product_id) {
        productMap.set(product.product_id.toString(), {
          id: product.product_id.toString(),
          title: product.name || null,
          img_url: product.img_url || null,
        })
      }
    })

    return productMap
  } catch (error) {
    console.error("Error in fetchProductDetails:", error)
    return new Map()
  }
}

const parseNumber = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const parseQuantity = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) ? parsed : 1
  }
  return 1
}

const formatMonthLabel = (period: string) => {
  const [year, month] = period.split("-")
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleString("default", { month: "short", year: "numeric" })
}

const getPeriodKey = (value: string | undefined) => {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 7)
  }
  return date.toISOString().slice(0, 7)
}

const buildAnalytics = (
  items: SupabaseLineItem[],
  payoutSettings: PayoutSetting[],
  productDetails: Map<string, ProductDetail> = new Map(),
) => {
  const payoutMap = new Map(
    payoutSettings.map((setting) => [
      setting.product_id,
      {
        amount: parseNumber(setting.payout_amount),
        isPercentage: Boolean(setting.is_percentage),
      },
    ]),
  )

  const salesByPeriod = new Map<
    string,
    {
      sales: number
      revenue: number
    }
  >()

  const salesByProduct = new Map<
    string,
    {
      productId: string
      title: string
      imageUrl: string | null
      sales: number
      revenue: number
      payoutType: "percentage" | "flat"
      payoutAmount: number
    }
  >()

  const salesHistory = []

  for (const item of items) {
    const quantity = parseQuantity(item.quantity)
    const unitPrice = parseNumber(item.price)
    const productId = item.product_id ?? "unknown"
    
    // Get product name and image from productDetails map or fallback to line item name
    const productDetail = productDetails.get(productId)
    const title = productDetail?.title || item.name || `Product ${productId}`
    const imageUrl = productDetail?.img_url || item.img_url || null
    
    const period = getPeriodKey(item.created_at)

    const payout = payoutMap.get(productId)
    const payoutAmount = payout ? payout.amount : 0
    const payoutType = payout?.isPercentage ? "percentage" : "flat"
    const revenue = payout
      ? payout.isPercentage
        ? unitPrice * quantity * (payout.amount / 100)
        : payout.amount * quantity
      : unitPrice * quantity * 0.1

    const periodEntry = salesByPeriod.get(period) ?? { sales: 0, revenue: 0 }
    periodEntry.sales += quantity
    periodEntry.revenue += revenue
    salesByPeriod.set(period, periodEntry)

    const productEntry =
      salesByProduct.get(productId) ??
      {
        productId,
        title,
        imageUrl,
        sales: 0,
        revenue: 0,
        payoutType,
        payoutAmount,
      }

    productEntry.sales += quantity
    productEntry.revenue += revenue
    productEntry.payoutType = payoutType
    productEntry.payoutAmount = payoutAmount
    // Update imageUrl if we have a better one
    if (imageUrl && !productEntry.imageUrl) {
      productEntry.imageUrl = imageUrl
    }
    salesByProduct.set(productId, productEntry)

    salesHistory.push({
      id: item.id || `item-${Math.random().toString(36).substring(2, 9)}`,
      product_id: productId,
      title,
      imageUrl,
      date: item.created_at || new Date().toISOString(),
      price: unitPrice,
      quantity,
      revenue: Number(revenue.toFixed(2)),
      currency: DEFAULT_CURRENCY,
      payout: payout
        ? {
            type: payoutType,
            amount: payoutAmount,
          }
        : null,
    })
  }

  const salesByDate = Array.from(salesByPeriod.entries())
    .map(([period, data]) => ({
      period,
      month: formatMonthLabel(period),
      sales: data.sales,
      revenue: Number(data.revenue.toFixed(2)),
    }))
    .sort((a, b) => a.period.localeCompare(b.period))

  const salesByProductArray = Array.from(salesByProduct.values())
    .map((product) => ({
      ...product,
      revenue: Number(product.revenue.toFixed(2)),
    }))
    .sort((a, b) => b.sales - a.sales)

  const history = salesHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return {
    salesByDate,
    salesByProduct: salesByProductArray,
    salesHistory: history,
  }
}
