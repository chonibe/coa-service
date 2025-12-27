import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase-server"

// Vendors excluded from payout calculations (e.g., internal/company vendors)
const EXCLUDED_VENDORS = ["Street Collector", "street collector", "street-collector"]

export async function GET(request: NextRequest) {
  try {
    console.log("=".repeat(80))
    console.log("[pending-payouts] ========== STARTING PAYOUT FETCH ==========")
    console.log("=".repeat(80))
    
    const supabase = createClient()
    
    // Get pagination parameters from query string
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "50")
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    console.log(`[pending-payouts] Pagination: page=${page}, pageSize=${pageSize}, from=${from}, to=${to}`)

    // Try to use the function if it exists
    let useFallback = false
    try {
      console.log(`[pending-payouts] Attempting to call get_pending_vendor_payouts RPC function...`)
      
      // For RPC functions, we need to get all data and paginate in memory
      // since Supabase RPC doesn't support range directly
      const { data, error } = await supabase.rpc("get_pending_vendor_payouts")
      
      console.log(`[pending-payouts] RPC call completed. Error:`, error ? JSON.stringify(error, null, 2) : "none")
      console.log(`[pending-payouts] RPC call completed. Data type:`, typeof data)
      console.log(`[pending-payouts] RPC call completed. Data is array:`, Array.isArray(data))
      console.log(`[pending-payouts] RPC call completed. Data length:`, data?.length ?? "null/undefined")

      if (error) {
        console.error("[pending-payouts] Error calling get_pending_vendor_payouts function:", error)
        console.error("[pending-payouts] Error details:", JSON.stringify(error, null, 2))
        useFallback = true
      } else if (data && data.length > 0) {
        console.log(`[pending-payouts] ========== RPC FUNCTION RESULT ==========`)
        console.log(`[pending-payouts] ✅ SUCCESS: Found ${data.length} vendors via RPC function`)
        console.log(`[pending-payouts] First vendor sample:`, JSON.stringify(data[0], null, 2))
        console.log(`[pending-payouts] All vendor names:`, data.map((v: any) => v.vendor_name).join(", "))
        
        // Filter out excluded vendors
        const filteredData = data.filter((vendor: any) => 
          !EXCLUDED_VENDORS.includes(vendor.vendor_name)
        )
        
        // Paginate the results
        const total = filteredData.length
        const paginatedData = filteredData.slice(from, to + 1)

        console.log(`[pending-payouts] ========== PAGINATION RESULT ==========`)
        console.log(`[pending-payouts] Total vendors (after exclusion): ${total}`)
        console.log(`[pending-payouts] Returning page ${page} with ${paginatedData.length} vendors`)
        console.log(`[pending-payouts] ========== END RPC PATH ==========`)

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
      } else {
        // RPC returned 0 vendors - fall back to direct query to investigate
        console.log(`[pending-payouts] ========== RPC FUNCTION RESULT ==========`)
        console.log(`[pending-payouts] ⚠️  WARNING: No vendors returned from RPC function`)
        console.log(`[pending-payouts] Data value:`, data)
        console.log(`[pending-payouts] Data === null:`, data === null)
        console.log(`[pending-payouts] Data === undefined:`, data === undefined)
        console.log(`[pending-payouts] Falling back to direct query method to investigate...`)
        useFallback = true
      }
    } catch (funcError: any) {
      console.error("=".repeat(80))
      console.error("[pending-payouts] ========== RPC FUNCTION ERROR ==========")
      console.error("[pending-payouts] Error using get_pending_vendor_payouts function:", funcError)
      console.error("[pending-payouts] Function error details:", JSON.stringify({
        message: funcError?.message,
        code: funcError?.code,
        details: funcError?.details,
        hint: funcError?.hint
      }, null, 2))
      console.error("=".repeat(80))
      useFallback = true
    }

    // Fallback to direct query if function doesn't exist or returned 0 vendors
    if (useFallback) {
      // Updated to filter by fulfillment_status = 'fulfilled' and use default 25% payout
      // Get all fulfilled line items - include all order statuses (active, closed, completed, etc.)
      // We only filter by fulfillment_status, not order status
      // Fetch all items with pagination to avoid Supabase default limit
      console.log("=".repeat(80))
      console.log("[pending-payouts] ========== USING FALLBACK QUERY METHOD ==========")
      console.log("=".repeat(80))
      
      let allLineItems: any[] = []
      let batchOffset = 0
      const batchPageSize = 1000
      let hasMore = true

      while (hasMore) {
        // Get line items that meet one of these criteria:
        // 1. fulfillment_status = 'fulfilled' or 'partially_fulfilled' (will be filtered by financial_status later)
        // 2. Has an active edition number (edition_number IS NOT NULL AND status = 'active')
        // Exclude restocked items (restocked = false or null)
        const { data: lineItems, error: lineItemsError, count } = await supabase
          .from("order_line_items_v2")
          .select("vendor_name, line_item_id, order_id, product_id, price, created_at, fulfillment_status, edition_number, status, restocked", { count: 'exact' })
          .not("vendor_name", "is", null)
          .or("fulfillment_status.in.(fulfilled,partially_fulfilled),and(edition_number.not.is.null,status.eq.active)") // Either fulfilled/partially_fulfilled OR has active edition number
          .eq("restocked", false) // Exclude restocked items
          .range(batchOffset, batchOffset + batchPageSize - 1)
          .order("created_at", { ascending: true }) // Order by oldest first to ensure we get all historical items
        
        if (lineItemsError) {
          console.error("[pending-payouts] Error fetching line items:", lineItemsError)
          return NextResponse.json({ error: lineItemsError.message }, { status: 500 })
        }

        console.log(`[pending-payouts] Fetched ${lineItems?.length || 0} line items (batch ${Math.floor(batchOffset / batchPageSize) + 1}), total count: ${count}`)
        
        if (lineItems && lineItems.length > 0) {
          // Log date range for this batch
          const dates = lineItems.map((item: any) => item.created_at).filter(Boolean).sort()
          if (dates.length > 0) {
            console.log(`[pending-payouts] Batch date range: ${dates[0]} to ${dates[dates.length - 1]}`)
          }
          
          allLineItems = [...allLineItems, ...lineItems]
          batchOffset += batchPageSize
          hasMore = lineItems.length === batchPageSize && (count === null || batchOffset < count)
          
          // Log sample of first batch
          if (allLineItems.length === lineItems.length) {
            console.log(`[pending-payouts] First batch sample:`, JSON.stringify(lineItems.slice(0, 3), null, 2))
            const vendorNames = [...new Set(lineItems.map((item: any) => item.vendor_name).filter(Boolean))]
            console.log(`[pending-payouts] Unique vendors in first batch:`, vendorNames.join(", "))
          }
        } else {
          hasMore = false
        }
      }
      
      // Log overall date range of all fetched items
      if (allLineItems.length > 0) {
        const allDates = allLineItems.map((item: any) => item.created_at).filter(Boolean).sort()
        if (allDates.length > 0) {
          console.log(`[pending-payouts] Overall date range: ${allDates[0]} to ${allDates[allDates.length - 1]}`)
        }
      }
      
      console.log(`[pending-payouts] Total line items found (fulfilled/partially_fulfilled OR with active edition): ${allLineItems.length}`)
      
      // Separate items into two groups:
      // 1. Items with active edition numbers (always include these, but exclude cancelled orders)
      // 2. Items that need financial_status check (fulfilled/partially_fulfilled)
      const itemsWithActiveEdition = allLineItems.filter((item: any) => 
        item.edition_number !== null && item.edition_number !== undefined && item.status === 'active'
      )
      const itemsNeedingFinancialCheck = allLineItems.filter((item: any) => 
        !(item.edition_number !== null && item.edition_number !== undefined && item.status === 'active')
      )
      
      console.log(`[pending-payouts] Items with active edition numbers: ${itemsWithActiveEdition.length}`)
      console.log(`[pending-payouts] Items needing financial_status check: ${itemsNeedingFinancialCheck.length}`)
      
      // Get all order IDs to check financial_status
      const allOrderIds = [...new Set(allLineItems.map((item: any) => item.order_id))]
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id, financial_status")
        .in("id", allOrderIds)
      
      if (ordersError) {
        console.error("[pending-payouts] Error fetching orders:", ordersError)
      } else {
        // Exclude cancelled orders (financial_status = 'voided')
        const cancelledOrderIds = new Set(
          orders?.filter((order: any) => order.financial_status === 'voided').map((order: any) => order.id) || []
        )
        console.log(`[pending-payouts] Found ${cancelledOrderIds.size} cancelled orders (financial_status = 'voided')`)
        
        // Filter items with active edition numbers - exclude cancelled orders
        // Note: Cancelled orders should not have edition numbers, but we verify this here
        const validItemsWithActiveEdition = itemsWithActiveEdition.filter((item: any) => {
          const isFromCancelledOrder = cancelledOrderIds.has(item.order_id)
          if (isFromCancelledOrder) {
            console.warn(`[pending-payouts] WARNING: Item ${item.line_item_id} has edition number ${item.edition_number} but is from cancelled order ${item.order_id}`)
          }
          return !isFromCancelledOrder
        })
        console.log(`[pending-payouts] Items with active edition (excluding cancelled): ${validItemsWithActiveEdition.length}`)
        
        // Filter items needing financial_status check - only include orders with financial_status = 'paid', 'refunded', or 'complete' (and not cancelled)
        const validOrderIds = new Set(
          orders?.filter((order: any) => 
            (order.financial_status === 'paid' || 
             order.financial_status === 'refunded' || 
             order.financial_status === 'complete') &&
            order.financial_status !== 'voided' // Extra check (should already be excluded but just to be safe)
          ).map((order: any) => order.id) || []
        )
        
        const validItemsFromFinancialCheck = itemsNeedingFinancialCheck.filter((item: any) => 
          validOrderIds.has(item.order_id)
        )
        console.log(`[pending-payouts] Items passing financial_status check: ${validItemsFromFinancialCheck.length}`)
        
        // Combine both groups
        allLineItems = [...validItemsWithActiveEdition, ...validItemsFromFinancialCheck]
        console.log(`[pending-payouts] Final total items: ${allLineItems.length} (${validItemsWithActiveEdition.length} with active edition + ${validItemsFromFinancialCheck.length} from financial check)`)
      }

      // Get paid line items
      let allPaidItems: any[] = []
      let paidBatchOffset = 0
      let hasMorePaid = true
      
      while (hasMorePaid) {
        const { data: paidItems, error: paidError, count: paidCount } = await supabase
          .from("vendor_payout_items")
          .select("line_item_id", { count: 'exact' })
          .not("payout_id", "is", null)
          .range(paidBatchOffset, paidBatchOffset + batchPageSize - 1)
        
        if (paidError) {
          console.error("[pending-payouts] Error fetching paid items:", paidError)
          break
        }

        if (paidItems && paidItems.length > 0) {
          allPaidItems = [...allPaidItems, ...paidItems]
          paidBatchOffset += batchPageSize
          hasMorePaid = paidItems.length === batchPageSize && (paidCount === null || paidBatchOffset < paidCount)
        } else {
          hasMorePaid = false
        }
      }

      const paidLineItemIds = new Set(allPaidItems.map((item: any) => item.line_item_id))
      console.log(`[pending-payouts] Found ${paidLineItemIds.size} already paid line items`)

      // Filter out paid items
      const unpaidItems = allLineItems.filter((item: any) => !paidLineItemIds.has(item.line_item_id))
      console.log(`[pending-payouts] Unpaid items after filtering: ${unpaidItems.length}`)

      // Get ALL vendors from the vendors table (not just those with unpaid items)
      let allVendors: any[] = []
      let vendorBatchOffset = 0
      let hasMoreVendors = true
      
      console.log(`[pending-payouts] Fetching all vendors from vendors table...`)
      
      while (hasMoreVendors) {
        const { data: vendors, error: vendorsError, count: vendorsCount } = await supabase
          .from("vendors")
          .select("vendor_name, paypal_email, tax_id, tax_country, is_company", { count: 'exact' })
          .range(vendorBatchOffset, vendorBatchOffset + batchPageSize - 1)
          .order("vendor_name", { ascending: true })
        
        if (vendorsError) {
          console.error("[pending-payouts] Error fetching vendors:", vendorsError)
          break
        }

        console.log(`[pending-payouts] Fetched ${vendors?.length || 0} vendors (batch ${Math.floor(vendorBatchOffset / batchPageSize) + 1}), total count: ${vendorsCount}`)

        if (vendors && vendors.length > 0) {
          allVendors = [...allVendors, ...vendors]
          vendorBatchOffset += batchPageSize
          hasMoreVendors = vendors.length === batchPageSize && (vendorsCount === null || vendorBatchOffset < vendorsCount)
          
          // Log sample of first batch
          if (allVendors.length === vendors.length) {
            console.log(`[pending-payouts] First vendor batch sample:`, JSON.stringify(vendors.slice(0, 3), null, 2))
            console.log(`[pending-payouts] Vendor names from first batch:`, vendors.map((v: any) => v.vendor_name).join(", "))
          }
        } else {
          hasMoreVendors = false
        }
      }
      
      console.log(`[pending-payouts] Total vendors found in vendors table: ${allVendors.length}`)

      // Get all unique vendor names from line items AND vendors table
      const vendorNamesFromItems = [...new Set(unpaidItems.map((item: any) => item.vendor_name).filter(Boolean))]
      const vendorNamesFromTable = allVendors.map((v: any) => v.vendor_name)
      const allVendorNames = [...new Set([...vendorNamesFromItems, ...vendorNamesFromTable])]
      
      console.log(`[pending-payouts] Unique vendors from line items: ${vendorNamesFromItems.length}`)
      console.log(`[pending-payouts] Vendor names from line items:`, vendorNamesFromItems.slice(0, 10).join(", "), vendorNamesFromItems.length > 10 ? `... (${vendorNamesFromItems.length} total)` : "")
      console.log(`[pending-payouts] Unique vendors from vendors table: ${vendorNamesFromTable.length}`)
      console.log(`[pending-payouts] Total unique vendors (combined): ${allVendorNames.length}`)
      console.log(`[pending-payouts] All vendor names:`, allVendorNames.slice(0, 20).join(", "), allVendorNames.length > 20 ? `... (${allVendorNames.length} total)` : "")

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
      // Include all items regardless of fulfillment_status (except cancelled orders which were already filtered out)
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
        const itemPrice = item.price || 0
        
        // Always use exactly 25% of the item price for ALL payouts
        // Custom payout settings are disabled
        const payoutAmount = 25
        const isPercentage = true // Always percentage
        
        // Calculate payout (will be $0 for items with $0 price, but still include them)
        const itemPayout = isPercentage 
          ? (itemPrice * payoutAmount / 100)
          : payoutAmount
        
        vendor.amount += itemPayout
        vendor.product_count += 1
        vendor.line_items.push(item.line_item_id)
      })

      // Get last payout dates for all vendors
      let allLastPayouts: any[] = []
      let payoutsBatchOffset = 0
      let hasMorePayouts = true
      
      while (hasMorePayouts) {
        const { data: lastPayouts, error: payoutsError, count: payoutsCount } = await supabase
          .from("vendor_payouts")
          .select("vendor_name, payout_date", { count: 'exact' })
          .in("vendor_name", allVendorNames)
          .eq("status", "completed")
          .order("payout_date", { ascending: false })
          .range(payoutsBatchOffset, payoutsBatchOffset + batchPageSize - 1)
        
        if (payoutsError) {
          console.error("Error fetching last payouts:", payoutsError)
          break
        }

        if (lastPayouts && lastPayouts.length > 0) {
          allLastPayouts = [...allLastPayouts, ...lastPayouts]
          payoutsBatchOffset += batchPageSize
          hasMorePayouts = lastPayouts.length === batchPageSize && (payoutsCount === null || payoutsBatchOffset < payoutsCount)
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

      // Build payouts array with ALL vendors (including $0 pending), excluding Street Collector
      const payouts = Array.from(vendorMap.values())
        .filter((vendor) => !EXCLUDED_VENDORS.includes(vendor.vendor_name))
        .map((vendor) => ({
          vendor_name: vendor.vendor_name,
          amount: vendor.amount,
          product_count: vendor.product_count,
          paypal_email: vendor.paypal_email,
          tax_id: vendor.tax_id,
          tax_country: vendor.tax_country,
          is_company: vendor.is_company,
          last_payout_date: lastPayoutMap.get(vendor.vendor_name) || null,
        })).sort((a, b) => b.amount - a.amount)
      
      console.log(`[pending-payouts] Built ${payouts.length} payout records`)
      console.log(`[pending-payouts] Vendors with pending amount > 0:`, payouts.filter((p: any) => p.amount > 0).length)
      if (payouts.length > 0) {
        console.log(`[pending-payouts] Top 5 payouts:`, payouts.slice(0, 5).map((p: any) => `${p.vendor_name}: £${p.amount.toFixed(2)} (${p.product_count} items)`).join(", "))
      }

      // Paginate the results
      const total = payouts.length
      const paginatedPayouts = payouts.slice(from, to + 1)
      
      console.log("=".repeat(80))
      console.log("[pending-payouts] ========== FINAL RESULT ==========")
      console.log(`[pending-payouts] Total payouts built: ${total}`)
      console.log(`[pending-payouts] Paginated payouts: ${paginatedPayouts.length}`)
      console.log(`[pending-payouts] Returning page ${page} with ${paginatedPayouts.length} vendors (total: ${total})`)
      console.log("=".repeat(80))

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
    console.error("=".repeat(80))
    console.error("[pending-payouts] ========== FATAL ERROR ==========")
    console.error("[pending-payouts] Error in pending payouts API:", error)
    console.error("[pending-payouts] Error stack:", error?.stack)
    console.error("=".repeat(80))
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
