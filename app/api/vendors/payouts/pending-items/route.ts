import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const { vendorName, startDate, endDate, includePaid = false } = await request.json()

    if (!vendorName) {
      return NextResponse.json({ error: "Vendor name is required" }, { status: 400 })
    }

    const supabase = createClient()

    // Fallback to direct query - Get ALL fulfilled line items for this vendor (not just pending)
    let query = supabase
      .from("order_line_items_v2")
      .select("line_item_id, order_id, order_name, product_id, price, created_at, fulfillment_status")
      .eq("status", "active")
      .eq("vendor_name", vendorName)
      .eq("fulfillment_status", "fulfilled")

    // Apply date range filter if provided
    if (startDate) {
      query = query.gte("created_at", startDate)
    }
    if (endDate) {
      query = query.lte("created_at", endDate)
    }

    const { data: lineItems, error: lineItemsError } = await query

      if (lineItemsError) {
        console.error("Error fetching line items:", lineItemsError)
        return NextResponse.json({ error: lineItemsError.message }, { status: 500 })
      }

      // Get paid line items to mark them and optionally filter them out
      const { data: paidItems } = await supabase
        .from("vendor_payout_items")
        .select("line_item_id, payout_id")
        .not("payout_id", "is", null)

      const paidLineItemIds = new Set(paidItems?.map((item: any) => item.line_item_id) || [])

      // Filter out paid items if includePaid is false
      let itemsToProcess = lineItems || []
      if (!includePaid) {
        itemsToProcess = lineItems?.filter((item: any) => !paidLineItemIds.has(item.line_item_id)) || []
      }

      // Get product titles and payout settings
      const productIds = [...new Set(itemsToProcess.map((item: any) => item.product_id))]
      
      const { data: products } = await supabase
        .from("products")
        .select("id, title")
        .in("id", productIds)

      const { data: payoutSettings } = await supabase
        .from("product_vendor_payouts")
        .select("product_id, vendor_name, payout_amount, is_percentage")
        .in("product_id", productIds)
        .eq("vendor_name", vendorName)

      const productMap = new Map<string, any>()
      products?.forEach((product: any) => {
        productMap.set(product.id, product.title)
      })

      const payoutMap = new Map<string, any>()
      payoutSettings?.forEach((setting: any) => {
        payoutMap.set(setting.product_id, setting)
      })

      // Build response
      const data = itemsToProcess.map((item: any) => {
        const payoutSetting = payoutMap.get(item.product_id)
        return {
          line_item_id: item.line_item_id,
          order_id: item.order_id,
          order_name: item.order_name,
          product_id: item.product_id,
          product_title: productMap.get(item.product_id) || null,
          price: item.price || 0,
          created_at: item.created_at,
          payout_amount: payoutSetting?.payout_amount ?? 25,
          is_percentage: payoutSetting?.is_percentage ?? true,
          fulfillment_status: item.fulfillment_status,
          is_paid: paidLineItemIds.has(item.line_item_id),
        }
      }).sort((a, b) => {
        if (a.order_id !== b.order_id) {
          return a.order_id.localeCompare(b.order_id)
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })

      return NextResponse.json({ lineItems: data })
    }
  } catch (error: any) {
    console.error("Error in pending line items API:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
