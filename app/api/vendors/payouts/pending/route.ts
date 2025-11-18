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
        console.error("Error calling get_pending_vendor_payouts function:", error)
        throw error
      }

      console.log(`[pending-payouts] Function returned ${data?.length || 0} vendors`)

      // Paginate the results
      const total = data?.length || 0
      const paginatedData = data?.slice(from, to + 1) || []

      console.log(`[pending-payouts] Returning page ${page} with ${paginatedData.length} vendors (total: ${total})`)

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
    } catch (funcError: any) {
      console.error("Error using get_pending_vendor_payouts function:", funcError)
      console.error("Function error details:", {
        message: funcError?.message,
        code: funcError?.code,
        details: funcError?.details,
        hint: funcError?.hint
      })

      // Fallback to direct query if function doesn't exist
      // Updated to filter by fulfillment_status = 'fulfilled' and use default 25% payout
      // Get all fulfilled line items - include all order statuses (active, closed, completed, etc.)
      // We only filter by fulfillment_status, not order status
      // Fetch all items with pagination to avoid Supabase default limit
      let allLineItems: any[] = []
      let from = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data: lineItems, error: lineItemsError, count } = await supabase
          .from("order_line_items_v2")
          .select("vendor_name, line_item_id, order_id, product_id, price", { count: 'exact' })
          .not("vendor_name", "is", null)
          .eq("fulfillment_status", "fulfilled")
          .range(from, from + pageSize - 1)
          .order("created_at", { ascending: false })
        
        if (lineItemsError) {
          console.error("Error fetching line items:", lineItemsError)
          return NextResponse.json({ error: lineItemsError.message }, { status: 500 })
        }

        if (lineItems && lineItems.length > 0) {
          allLineItems = [...allLineItems, ...lineItems]
          from += pageSize
          hasMore = lineItems.length === pageSize && (count === null || from < count)
        } else {
          hasMore = false
        }
      }

      // Get paid line items
      let allPaidItems: any[] = []
      let paidFrom = 0
      let hasMorePaid = true
      
      while (hasMorePaid) {
        const { data: paidItems, error: paidError, count: paidCount } = await supabase
          .from("vendor_payout_items")
          .select("line_item_id", { count: 'exact' })
          .not("payout_id", "is", null)
          .range(paidFrom, paidFrom + pageSize - 1)
        
        if (paidError) {
          console.error("Error fetching paid items:", paidError)
          break
        }

        if (paidItems && paidItems.length > 0) {
          allPaidItems = [...allPaidItems, ...paidItems]
          paidFrom += pageSize
          hasMorePaid = paidItems.length === pageSize && (paidCount === null || paidFrom < paidCount)
        } else {
          hasMorePaid = false
        }
      }

      const paidLineItemIds = new Set(allPaidItems.map((item: any) => item.line_item_id))

      // Filter out paid items
      const unpaidItems = allLineItems.filter((item: any) => !paidLineItemIds.has(item.line_item_id))

      // Get ALL vendors from the vendors table (not just those with unpaid items)
      let allVendors: any[] = []
      let vendorFrom = 0
      let hasMoreVendors = true
      
      while (hasMoreVendors) {
        const { data: vendors, error: vendorsError, count: vendorsCount } = await supabase
          .from("vendors")
          .select("vendor_name, paypal_email, tax_id, tax_country, is_company", { count: 'exact' })
          .range(vendorFrom, vendorFrom + pageSize - 1)
          .order("vendor_name", { ascending: true })
        
        if (vendorsError) {
          console.error("Error fetching vendors:", vendorsError)
          break
        }

        if (vendors && vendors.length > 0) {
          allVendors = [...allVendors, ...vendors]
          vendorFrom += pageSize
          hasMoreVendors = vendors.length === pageSize && (vendorsCount === null || vendorFrom < vendorsCount)
        } else {
          hasMoreVendors = false
        }
      }

      // Get all unique vendor names from line items AND vendors table
      const vendorNamesFromItems = [...new Set(unpaidItems.map((item: any) => item.vendor_name).filter(Boolean))]
      const vendorNamesFromTable = allVendors.map((v: any) => v.vendor_name)
      const allVendorNames = [...new Set([...vendorNamesFromItems, ...vendorNamesFromTable])]

      // Get payout settings for products
      const productIds = [...new Set(unpaidItems.map((item: any) => item.product_id))]
      
      let allPayoutSettings: any[] = []
      if (productIds.length > 0 && allVendorNames.length > 0) {
        // Fetch payout settings in batches if needed
        let settingsFrom = 0
        let hasMoreSettings = true
        
        while (hasMoreSettings) {
          const batchProductIds = productIds.slice(settingsFrom, settingsFrom + 100)
          if (batchProductIds.length === 0) break
          
          const { data: payoutSettings, error: settingsError } = await supabase
            .from("product_vendor_payouts")
            .select("product_id, vendor_name, payout_amount, is_percentage")
            .in("product_id", batchProductIds)
            .in("vendor_name", allVendorNames)
          
          if (settingsError) {
            console.error("Error fetching payout settings:", settingsError)
            break
          }

          if (payoutSettings && payoutSettings.length > 0) {
            allPayoutSettings = [...allPayoutSettings, ...payoutSettings]
          }
          
          settingsFrom += 100
          hasMoreSettings = batchProductIds.length === 100
        }
      }

      const payoutMap = new Map<string, any>()
      allPayoutSettings.forEach((setting: any) => {
        const key = `${setting.product_id}_${setting.vendor_name}`
        payoutMap.set(key, setting)
      })

      // Initialize vendor map with ALL vendors (including those with $0 pending)
      const vendorMap = new Map<string, any>()
      allVendors.forEach((vendor: any) => {
        vendorMap.set(vendor.vendor_name, {
          vendor_name: vendor.vendor_name,
          amount: 0,
          product_count: 0,
          line_items: [],
          paypal_email: vendor.paypal_email || null,
          tax_id: vendor.tax_id || null,
          tax_country: vendor.tax_country || null,
          is_company: vendor.is_company || false,
        })
      })
      
      // Process unpaid items to calculate payouts
      unpaidItems.forEach((item: any) => {
        const vendorName = item.vendor_name
        if (!vendorMap.has(vendorName)) {
          vendorMap.set(vendorName, {
            vendor_name: vendorName,
            amount: 0,
            product_count: 0,
            line_items: [],
            paypal_email: null,
            tax_id: null,
            tax_country: null,
            is_company: false,
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

      // Get last payout dates for all vendors
      let allLastPayouts: any[] = []
      let payoutsFrom = 0
      let hasMorePayouts = true
      
      while (hasMorePayouts) {
        const { data: lastPayouts, error: payoutsError, count: payoutsCount } = await supabase
          .from("vendor_payouts")
          .select("vendor_name, payout_date", { count: 'exact' })
          .in("vendor_name", allVendorNames)
          .eq("status", "completed")
          .order("payout_date", { ascending: false })
          .range(payoutsFrom, payoutsFrom + pageSize - 1)
        
        if (payoutsError) {
          console.error("Error fetching last payouts:", payoutsError)
          break
        }

        if (lastPayouts && lastPayouts.length > 0) {
          allLastPayouts = [...allLastPayouts, ...lastPayouts]
          payoutsFrom += pageSize
          hasMorePayouts = lastPayouts.length === pageSize && (payoutsCount === null || payoutsFrom < payoutsCount)
        } else {
          hasMorePayouts = false
        }
      }

      // Create a map of vendor name to last payout date
      const lastPayoutMap = new Map<string, string>()
      allLastPayouts.forEach((payout: any) => {
        if (!lastPayoutMap.has(payout.vendor_name)) {
          lastPayoutMap.set(payout.vendor_name, payout.payout_date)
        }
      })

      // Build payouts array with ALL vendors (including $0 pending)
      const payouts = Array.from(vendorMap.values()).map((vendor) => ({
        vendor_name: vendor.vendor_name,
        amount: vendor.amount,
        product_count: vendor.product_count,
        paypal_email: vendor.paypal_email,
        tax_id: vendor.tax_id,
        tax_country: vendor.tax_country,
        is_company: vendor.is_company,
        last_payout_date: lastPayoutMap.get(vendor.vendor_name) || null,
      })).sort((a, b) => b.amount - a.amount)

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
