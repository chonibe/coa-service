import { getSupabaseUrl, getSupabaseKey } from '@/lib/supabase/client-utils'
console.log('[API] /api/vendor/sales-analytics/route.ts loaded');

import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase-server"
import { SupabaseClient } from "@supabase/supabase-js"
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies"

interface LineItem {
  id: string
  product_id: string
  name: string
  price: number | string
  quantity: number
  created_at: string
  updated_at: string
  status: string
}

interface PayoutSetting {
  product_id: string
  payout_amount: number
  is_percentage: boolean
}

interface PayoutMapValue {
  amount: number
  isPercentage: boolean
}

interface SalesHistoryItem {
  id: string
  product_id: string
  title: string
  date: string
  price: number
  currency: string
  quantity: number
  payout_amount: number
}

export async function GET() {
  try {
    // Get vendor name from cookie - cookies() is synchronous in Next.js
    const cookieStore = cookies() as unknown as ReadonlyRequestCookies;
    const vendorName = cookieStore.get("vendor_session")?.value;

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log(`Fetching sales analytics for vendor: ${vendorName}`)

    // Create Supabase client with cookie store
    const supabase = createClient(cookieStore as unknown as Promise<ReadonlyRequestCookies>) as unknown as SupabaseClient;

    // Query for line items from this vendor
    const { data: lineItems, error } = await supabase
      .from("order_line_items_v2")
      .select("*")
      .eq("vendor_name", vendorName)
      .eq("status", "active")

    if (error) {
      console.error("Database error when fetching line items:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!lineItems || lineItems.length === 0) {
      return NextResponse.json({
        salesByDate: [],
        salesByProduct: [],
        salesHistory: [],
        totalItems: 0,
        totalPayouts: 0,
      })
    }

    // Get payout settings for all products
    const productIds = lineItems.map((item: LineItem) => item.product_id).filter(Boolean)
    const { data: payoutSettings, error: payoutError } = await supabase
      .from("product_vendor_payouts")
      .select("*")
      .in("product_id", productIds)

    if (payoutError) {
      console.error("Error fetching payout settings:", payoutError)
      return NextResponse.json({ error: "Failed to fetch payout settings" }, { status: 500 })
    }

    // Create a map of product IDs to payout settings
    const payoutMap = new Map<string, PayoutMapValue>(
      (payoutSettings || []).map((setting: PayoutSetting) => [
        setting.product_id,
        {
          amount: setting.payout_amount,
          isPercentage: setting.is_percentage,
        },
      ])
    )

    // Process line items to get sales by date
    const salesByDate = processSalesByDate(lineItems as LineItem[], payoutMap)

    // Get sales by product
    const salesByProduct = processSalesByProduct(lineItems as LineItem[], payoutMap)

    // Create sales history array with payout calculations
    const salesHistory = lineItems.map((item: LineItem): SalesHistoryItem => {
      const price = typeof item.price === "string" ? Number.parseFloat(item.price) : item.price || 0
      const payoutSetting = payoutMap.get(item.product_id)
      let payoutAmount = 0

      if (payoutSetting) {
        if (payoutSetting.isPercentage) {
          payoutAmount = (price * payoutSetting.amount) / 100
        } else {
          payoutAmount = payoutSetting.amount
        }
      } else {
        // Default 20% payout if no setting exists
        payoutAmount = price * 0.2
      }

      return {
        id: item.id || `item-${Math.random().toString(36).substring(2, 9)}`,
        product_id: item.product_id || "",
        title: item.name || "Unknown Product",
        date: item.created_at || new Date().toISOString(),
        price,
        currency: "GBP",
        quantity: item.quantity || 1,
        payout_amount: payoutAmount,
      }
    })

    // Calculate total payouts
    const totalPayouts = salesHistory.reduce((sum: number, item: SalesHistoryItem) => sum + item.payout_amount, 0)

    return NextResponse.json({
      salesByDate,
      salesByProduct,
      salesHistory,
      totalItems: lineItems.length,
      totalPayouts,
    })
  } catch (error) {
    console.error("Unexpected error in vendor sales analytics API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

// Fixed function to prevent recursion
function processSalesByDate(lineItems: LineItem[], payoutMap: Map<string, PayoutMapValue>) {
  // Group sales by month
  const salesByMonth: Record<string, { sales: number; revenue: number; payouts: number }> = {}

  lineItems.forEach((item: LineItem) => {
    // Ensure we have a valid date
    let date
    try {
      date = new Date(item.created_at || item.updated_at || Date.now())
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date for item ${item.id}:`, item.created_at)
        return
      }
    } catch (e) {
      console.warn(`Error parsing date for item ${item.id}:`, e)
      return
    }

    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

    if (!salesByMonth[monthYear]) {
      salesByMonth[monthYear] = { sales: 0, revenue: 0, payouts: 0 }
    }

    salesByMonth[monthYear].sales += 1

    // Add to revenue and calculate payout
    if (item.price !== null && item.price !== undefined) {
      const price = typeof item.price === "string" ? Number.parseFloat(item.price) : Number(item.price)
      if (!isNaN(price)) {
        salesByMonth[monthYear].revenue += price

        // Calculate payout
        const payoutSetting = payoutMap.get(item.product_id)
        let payoutAmount = 0

        if (payoutSetting) {
          if (payoutSetting.isPercentage) {
            payoutAmount = (price * payoutSetting.amount) / 100
          } else {
            payoutAmount = payoutSetting.amount
          }
        } else {
          // Default 20% payout if no setting exists
          payoutAmount = price * 0.2
        }

        salesByMonth[monthYear].payouts += payoutAmount
      }
    }
  })

  // Convert to array and sort by date
  return Object.entries(salesByMonth)
    .map(([date, data]) => ({
      date,
      month: getMonthName(date),
      sales: data.sales,
      revenue: Number(data.revenue.toFixed(2)),
      payouts: Number(data.payouts.toFixed(2)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

// Fixed function to prevent recursion
function processSalesByProduct(lineItems: LineItem[], payoutMap: Map<string, PayoutMapValue>) {
  // Group sales by product
  const salesByProduct: Record<string, {
    productId: string
    title: string
    sales: number
    revenue: number
    payouts: number
  }> = {}

  lineItems.forEach((item: LineItem) => {
    const productId = item.product_id || "unknown"
    const title = item.name || `Product ${productId}`

    if (!salesByProduct[productId]) {
      salesByProduct[productId] = {
        productId,
        title,
        sales: 0,
        revenue: 0,
        payouts: 0,
      }
    }

    salesByProduct[productId].sales += 1

    // Add to revenue and calculate payout
    if (item.price !== null && item.price !== undefined) {
      const price = typeof item.price === "string" ? Number.parseFloat(item.price) : Number(item.price)
      if (!isNaN(price)) {
        salesByProduct[productId].revenue += price

        // Calculate payout
        const payoutSetting = payoutMap.get(item.product_id)
        let payoutAmount = 0

        if (payoutSetting) {
          if (payoutSetting.isPercentage) {
            payoutAmount = (price * payoutSetting.amount) / 100
          } else {
            payoutAmount = payoutSetting.amount
          }
        } else {
          // Default 20% payout if no setting exists
          payoutAmount = price * 0.2
        }

        salesByProduct[productId].payouts += payoutAmount
      }
    }
  })

  // Convert to array and sort by sales
  return Object.values(salesByProduct).sort((a, b) => b.sales - a.sales)
}

function getMonthName(dateStr: string): string {
  const [year, month] = dateStr.split("-")
  const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, 1)
  return date.toLocaleString("default", { month: "short", year: "numeric" })
}
