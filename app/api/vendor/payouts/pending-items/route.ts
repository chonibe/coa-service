import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"

export async function GET() {
  const cookieStore = cookies()
  const vendorName = getVendorFromCookieStore(cookieStore)

  if (!vendorName) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const supabase = createClient()

    // 1. Fetch current exchange rates from the database
    const { data: rateData } = await supabase
      .from('exchange_rates')
      .select('from_currency, rate');
    
    const ratesMap = new Map<string, number>();
    rateData?.forEach(r => ratesMap.set(r.from_currency.toUpperCase(), Number(r.rate)));
    
    const getRate = (currency: string) => ratesMap.get(currency.toUpperCase()) || 1.0;

    // 2. Get all line items that have already been paid
    const { data: paidItems } = await supabase
      .from("vendor_payout_items")
      .select("line_item_id")
      .not("payout_id", "is", null)

    const paidLineItemIds = new Set((paidItems || []).map((item: any) => item.line_item_id))

    // Get all line items
    const { data: lineItems, error: lineItemsError } = await supabase
      .from("order_line_items_v2")
      .select(`
        line_item_id, 
        order_id, 
        order_name, 
        product_id, 
        name, 
        price, 
        created_at, 
        fulfillment_status, 
        status, 
        restocked,
        orders!inner(currency_code)
      `)
      .eq("vendor_name", vendorName)
      .or("fulfillment_status.in.(fulfilled,unfulfilled,partially_fulfilled),created_at.lt.2025-10-01")
      .neq("fulfillment_status", "restocked")

    if (lineItemsError) {
      console.error("Error fetching line items:", lineItemsError)
      return NextResponse.json({ error: "Failed to fetch line items" }, { status: 500 })
    }

    // Filter out already paid items, cancelled items, and restocked items
    const unpaidItems = (lineItems || []).filter((item: any) => 
      !paidLineItemIds.has(item.line_item_id) &&
      item.status !== 'cancelled' &&
      item.restocked !== true &&
      item.fulfillment_status !== 'restocked' // Also exclude items with fulfillment_status = 'restocked'
    )

    // Separate into fulfilled and unfulfilled
    const fulfilledItems = unpaidItems.filter((item: any) => item.fulfillment_status === 'fulfilled')
    const unfulfilledItems = unpaidItems.filter((item: any) => 
      item.fulfillment_status !== 'fulfilled' && 
      item.fulfillment_status !== 'restocked' // Double-check to exclude restocked items
    )

    // Calculate payout amounts for each line item
    const processItem = (item: any, includePayout: boolean = true) => {
      let originalPrice = Number(item.price || 0)
      const orderCurrency = item.orders?.currency_code || 'USD'
      const currencyUpper = orderCurrency.toUpperCase()
      
      // Only convert to USD if the source currency is NOT USD
      if (currencyUpper !== 'USD') {
        const rate = getRate(currencyUpper)
        originalPrice = originalPrice * rate
      }

      const createdAt = item.created_at ? new Date(item.created_at) : new Date()
      const october2025 = new Date('2025-10-01')
      
      let price = originalPrice
      
      // Apply historical adjustment: Pre-Oct 2025 (Historical price is always USD)
      if (createdAt < october2025) {
        price = 40.00
      }

      let payoutAmount = 0
      if (includePayout) {
        payoutAmount = (price * 25) / 100
        
        // Apply $10 minimum for orders before October 2025 (safety check)
        if (createdAt < october2025 && payoutAmount < 10) {
          payoutAmount = 10
        }
      }

      return {
        line_item_id: item.line_item_id,
        order_id: item.order_id,
        order_name: item.order_name,
        product_id: item.product_id,
        product_title: item.name || `Product ${item.product_id}`,
        price: price,
        payout_amount: payoutAmount,
        created_at: item.created_at,
        fulfillment_status: item.fulfillment_status || 'unfulfilled',
      }
    }

    const fulfilledWithPayouts = fulfilledItems.map(item => processItem(item, true))
    const unfulfilledWithPayouts = unfulfilledItems.map(item => processItem(item, true))

    // Group fulfilled items by month
    const groupByMonth = (items: any[]) => {
      return items.reduce((acc, item) => {
        const date = new Date(item.created_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        const monthName = date.toLocaleString("default", { month: "long", year: "numeric" })

        if (!acc[monthKey]) {
          acc[monthKey] = {
            month: monthName,
            monthKey,
            items: [],
            totalAmount: 0,
            itemCount: 0,
          }
        }

        acc[monthKey].items.push(item)
        acc[monthKey].totalAmount += item.payout_amount
        acc[monthKey].itemCount += 1

        return acc
      }, {} as Record<string, { month: string; monthKey: string; items: any[]; totalAmount: number; itemCount: number }>)
    }

    const fulfilledGroupedByMonth = Object.values(groupByMonth(fulfilledWithPayouts)).sort((a, b) => b.monthKey.localeCompare(a.monthKey))
    const unfulfilledGroupedByMonth = Object.values(groupByMonth(unfulfilledWithPayouts)).sort((a, b) => b.monthKey.localeCompare(a.monthKey))

    return NextResponse.json({
      lineItems: fulfilledWithPayouts,
      groupedByMonth: fulfilledGroupedByMonth,
      totalAmount: fulfilledWithPayouts.reduce((sum, item) => sum + item.payout_amount, 0),
      totalItems: fulfilledWithPayouts.length,
      unfulfilledItems: unfulfilledWithPayouts,
      unfulfilledGroupedByMonth: unfulfilledGroupedByMonth,
      unfulfilledTotalAmount: unfulfilledWithPayouts.reduce((sum, item) => sum + item.payout_amount, 0),
      unfulfilledTotalItems: unfulfilledWithPayouts.length,
    })
  } catch (error) {
    console.error("Error in vendor pending items route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

