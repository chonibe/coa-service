import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get pagination parameters from query string
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "50")
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Try to use the function if it exists
    try {
      // For RPC functions, we need to get all data and paginate in memory
      // since Supabase RPC doesn't support range directly
      const { data, error } = await supabase.rpc("get_pending_vendor_payouts")

      if (error) {
        throw error
      }

      // Paginate the results
      const total = data?.length || 0
      const paginatedData = data?.slice(from, to + 1) || []

      return NextResponse.json({ 
        payouts: paginatedData,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
          hasNext: to < total - 1,
          hasPrev: page > 1
        }
      })
    } catch (funcError) {
      console.error("Error using get_pending_vendor_payouts function:", funcError)

      // Fallback to direct query if function doesn't exist
      // Updated to filter by fulfillment_status = 'fulfilled' and use default 25% payout
      // Get all fulfilled line items
      const { data: lineItems, error: lineItemsError } = await supabase
        .from("order_line_items_v2")
        .select("vendor_name, line_item_id, order_id, product_id, price")
        .eq("status", "active")
        .not("vendor_name", "is", null)
        .eq("fulfillment_status", "fulfilled")

      if (lineItemsError) {
        console.error("Error fetching line items:", lineItemsError)
        return NextResponse.json({ error: lineItemsError.message }, { status: 500 })
      }

      // Get paid line items
      const { data: paidItems } = await supabase
        .from("vendor_payout_items")
        .select("line_item_id")
        .not("payout_id", "is", null)

      const paidLineItemIds = new Set(paidItems?.map((item: any) => item.line_item_id) || [])

      // Filter out paid items
      const unpaidItems = lineItems?.filter((item: any) => !paidLineItemIds.has(item.line_item_id)) || []

      // Get payout settings for products
      const productIds = [...new Set(unpaidItems.map((item: any) => item.product_id))]
      const uniqueVendorNames = [...new Set(unpaidItems.map((item: any) => item.vendor_name).filter(Boolean))]

      const { data: payoutSettings } = await supabase
        .from("product_vendor_payouts")
        .select("product_id, vendor_name, payout_amount, is_percentage")
        .in("product_id", productIds)
        .in("vendor_name", uniqueVendorNames)

      const payoutMap = new Map<string, any>()
      payoutSettings?.forEach((setting: any) => {
        const key = `${setting.product_id}_${setting.vendor_name}`
        payoutMap.set(key, setting)
      })

      // Process the data to calculate payouts
      const vendorMap = new Map<string, any>()
      
      unpaidItems.forEach((item: any) => {
        const vendorName = item.vendor_name
        if (!vendorMap.has(vendorName)) {
          vendorMap.set(vendorName, {
            vendor_name: vendorName,
            amount: 0,
            product_count: 0,
            line_items: [],
          })
        }
        
        const vendor = vendorMap.get(vendorName)!
        const payoutKey = `${item.product_id}_${vendorName}`
        const payoutSetting = payoutMap.get(payoutKey)
        const payoutAmount = payoutSetting?.payout_amount ?? 25
        const isPercentage = payoutSetting?.is_percentage ?? true
        
        const itemPayout = isPercentage 
          ? (item.price * payoutAmount / 100)
          : payoutAmount
        
        vendor.amount += itemPayout
        vendor.product_count += 1
        vendor.line_items.push(item.line_item_id)
      })

      // Get vendor details and last payout date
      const vendorNames = Array.from(vendorMap.keys())
      const { data: vendors } = await supabase
        .from("vendors")
        .select("vendor_name, paypal_email, tax_id, tax_country, is_company")
        .in("vendor_name", vendorNames)

      const { data: lastPayouts } = await supabase
        .from("vendor_payouts")
        .select("vendor_name, payout_date")
        .in("vendor_name", vendorNames)
        .eq("status", "completed")
        .order("payout_date", { ascending: false })

      const payouts = Array.from(vendorMap.values()).map((vendor) => {
        const vendorInfo = vendors?.find((v: any) => v.vendor_name === vendor.vendor_name)
        const lastPayout = lastPayouts?.find((p: any) => p.vendor_name === vendor.vendor_name)
        
        return {
          vendor_name: vendor.vendor_name,
          amount: vendor.amount,
          product_count: vendor.product_count,
          paypal_email: vendorInfo?.paypal_email || null,
          tax_id: vendorInfo?.tax_id || null,
          tax_country: vendorInfo?.tax_country || null,
          is_company: vendorInfo?.is_company || false,
          last_payout_date: lastPayout?.payout_date || null,
        }
      }).sort((a, b) => b.amount - a.amount)

      // Paginate the results
      const total = payouts.length
      const paginatedPayouts = payouts.slice(from, to + 1)

      return NextResponse.json({ 
        payouts: paginatedPayouts,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
          hasNext: to < total - 1,
          hasPrev: page > 1
        }
      })
    }
  } catch (error: any) {
    console.error("Error in pending payouts API:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
