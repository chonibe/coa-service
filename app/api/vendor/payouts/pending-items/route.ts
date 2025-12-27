import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { convertGBPToUSD } from "@/lib/utils"

export async function GET() {
  const cookieStore = cookies()
  const vendorName = getVendorFromCookieStore(cookieStore)

  if (!vendorName) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const supabase = createClient()

    // Get all line items that have already been paid
    const { data: paidItems } = await supabase
      .from("vendor_payout_items")
      .select("line_item_id")
      .not("payout_id", "is", null)

    const paidLineItemIds = new Set((paidItems || []).map((item: any) => item.line_item_id))

    // Get pending line items (fulfilled but not paid)
    const { data: lineItems, error: lineItemsError } = await supabase
      .from("order_line_items_v2")
      .select("line_item_id, order_id, order_name, product_id, name, price, created_at, fulfillment_status")
      .eq("vendor_name", vendorName)
      .eq("fulfillment_status", "fulfilled")

    if (lineItemsError) {
      console.error("Error fetching line items:", lineItemsError)
      return NextResponse.json({ error: "Failed to fetch line items" }, { status: 500 })
    }

    // Filter out already paid items
    const unpaidItems = (lineItems || []).filter((item: any) => !paidLineItemIds.has(item.line_item_id))

    // DISABLED: Custom payout settings - always use 25% of item price
    // Calculate payout amounts for each line item (always 25%)
    const lineItemsWithPayouts = unpaidItems.map((item: any) => {
      const payoutAmount = (convertGBPToUSD(item.price || 0) * 25) / 100 // Always 25%

      return {
        line_item_id: item.line_item_id,
        product_id: item.product_id,
        product_title: item.name || `Product ${item.product_id}`,
        price: convertGBPToUSD(item.price || 0),
        payout_amount: payoutAmount,
        created_at: item.created_at,
      }
    })

    // Group by month
    const groupedByMonth = lineItemsWithPayouts.reduce((acc, item) => {
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

    // Convert to array and sort by month (newest first)
    const months = Object.values(groupedByMonth).sort((a, b) => b.monthKey.localeCompare(a.monthKey))

    return NextResponse.json({
      lineItems: lineItemsWithPayouts,
      groupedByMonth: months,
      totalAmount: lineItemsWithPayouts.reduce((sum, item) => sum + item.payout_amount, 0),
      totalItems: lineItemsWithPayouts.length,
    })
  } catch (error) {
    console.error("Error in vendor pending items route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

