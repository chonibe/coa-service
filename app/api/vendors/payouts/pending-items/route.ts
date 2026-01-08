import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { convertGBPToUSD, convertNISToUSD } from "@/lib/utils"

// Vendors excluded from payout calculations (e.g., internal/company vendors)
const EXCLUDED_VENDORS = ["Street Collector", "street collector", "street-collector"]

export async function POST(request: Request) {
  try {
    const { vendorName, startDate, endDate, includePaid = false } = await request.json()

    if (!vendorName) {
      return NextResponse.json({ error: "Vendor name is required" }, { status: 400 })
    }

    // Return empty result for excluded vendors
    if (EXCLUDED_VENDORS.includes(vendorName)) {
      console.log(`[pending-items] Vendor "${vendorName}" is excluded from payouts, returning empty result`)
      return NextResponse.json({ lineItems: [] })
    }

    console.log(`[pending-items] Fetching line items for vendor: ${vendorName}`)
    console.log(`[pending-items] Date filters - startDate: ${startDate || 'none'}, endDate: ${endDate || 'none'}`)
    console.log(`[pending-items] Include paid: ${includePaid}`)

    const supabase = createClient()

    // Get line items for this vendor
    // Join with orders to get the currency_code
    let query = supabase
      .from("order_line_items_v2")
      .select(`
        line_item_id, 
        order_id, 
        order_name, 
        product_id, 
        price, 
        created_at, 
        fulfillment_status, 
        edition_number, 
        status, 
        restocked, 
        name,
        orders!inner(currency_code)
      `, { count: 'exact' })
      .eq("vendor_name", vendorName)
      .or("fulfillment_status.in.(fulfilled,partially_fulfilled,unfulfilled),and(edition_number.not.is.null,status.eq.active),created_at.lt.2025-10-01")
      .eq("restocked", false)
      .order("created_at", { ascending: false })

    // Apply date range filter ONLY if explicitly provided
    if (startDate) {
      console.log(`[pending-items] Applying startDate filter: ${startDate}`)
      query = query.gte("created_at", startDate)
    }
    if (endDate) {
      console.log(`[pending-items] Applying endDate filter: ${endDate}`)
      query = query.lte("created_at", endDate)
    }

    // Fetch all items - Supabase default limit is 1000, so we may need to paginate
    let allLineItems: any[] = []
    let from = 0
    const pageSize = 1000
    let hasMore = true

    while (hasMore) {
      const { data: lineItems, error: lineItemsError, count } = await query.range(from, from + pageSize - 1)
      
      if (lineItemsError) {
        console.error("[pending-items] Error fetching line items:", lineItemsError)
        return NextResponse.json({ error: lineItemsError.message }, { status: 500 })
      }

      console.log(`[pending-items] Fetched batch: ${lineItems?.length || 0} items (total count: ${count})`)

      if (lineItems && lineItems.length > 0) {
        // Log date range for this batch
        const dates = lineItems.map((item: any) => item.created_at).filter(Boolean).sort()
        if (dates.length > 0) {
          console.log(`[pending-items] Batch date range: ${dates[0]} to ${dates[dates.length - 1]}`)
        }
        
        allLineItems = [...allLineItems, ...lineItems]
        from += pageSize
        hasMore = lineItems.length === pageSize && (count === null || from < count)
      } else {
        hasMore = false
      }
    }

    // Log overall date range
    if (allLineItems.length > 0) {
      const allDates = allLineItems.map((item: any) => item.created_at).filter(Boolean).sort()
      if (allDates.length > 0) {
        console.log(`[pending-items] Total items fetched: ${allLineItems.length}`)
        console.log(`[pending-items] Overall date range: ${allDates[0]} to ${allDates[allDates.length - 1]}`)
      }
    } else {
      console.log(`[pending-items] No items found for vendor: ${vendorName}`)
    }

    // Separate items into two groups:
    // 1. Items with active edition numbers (always include these, but exclude cancelled orders)
    // 2. Items that need financial_status check (fulfilled/partially_fulfilled)
    const itemsWithActiveEdition = allLineItems.filter((item: any) => 
      item.edition_number !== null && item.edition_number !== undefined && item.status === 'active'
    )
    const itemsNeedingFinancialCheck = allLineItems.filter((item: any) => 
      !(item.edition_number !== null && item.edition_number !== undefined && item.status === 'active')
    )
    
    console.log(`[pending-items] Items with active edition numbers: ${itemsWithActiveEdition.length}`)
    console.log(`[pending-items] Items needing financial_status check: ${itemsNeedingFinancialCheck.length}`)
    
    // Get all order IDs to check financial_status
    const allOrderIds = [...new Set(allLineItems.map((item: any) => item.order_id))]
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, financial_status")
      .in("id", allOrderIds)
    
    if (ordersError) {
      console.error("[pending-items] Error fetching orders:", ordersError)
    } else {
      // Exclude cancelled orders (financial_status = 'voided')
      const cancelledOrderIds = new Set(
        orders?.filter((order: any) => order.financial_status === 'voided').map((order: any) => order.id) || []
      )
      console.log(`[pending-items] Found ${cancelledOrderIds.size} cancelled orders (financial_status = 'voided')`)
      
      // Filter items with active edition numbers - exclude cancelled orders
      // Note: Cancelled orders should not have edition numbers, but we verify this here
      const validItemsWithActiveEdition = itemsWithActiveEdition.filter((item: any) => {
        const isFromCancelledOrder = cancelledOrderIds.has(item.order_id)
        if (isFromCancelledOrder) {
          console.warn(`[pending-items] WARNING: Item ${item.line_item_id} has edition number ${item.edition_number} but is from cancelled order ${item.order_id}`)
        }
        return !isFromCancelledOrder
      })
      console.log(`[pending-items] Items with active edition (excluding cancelled): ${validItemsWithActiveEdition.length}`)
      
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
      console.log(`[pending-items] Items passing financial_status check: ${validItemsFromFinancialCheck.length}`)
      
      // Combine both groups
      allLineItems = [...validItemsWithActiveEdition, ...validItemsFromFinancialCheck]
      console.log(`[pending-items] Final total items: ${allLineItems.length} (${validItemsWithActiveEdition.length} with active edition + ${validItemsFromFinancialCheck.length} from financial check)`)
    }

    const lineItems = allLineItems

    // Get paid line items to mark them and optionally filter them out
    // Fetch all paid items with pagination, including payout reference
    let allPaidItems: any[] = []
    let paidFrom = 0
    let hasMorePaid = true
    
    while (hasMorePaid) {
      const { data: paidItems, error: paidError, count: paidCount } = await supabase
        .from("vendor_payout_items")
        .select("line_item_id, payout_id, payout_reference, marked_at, marked_by", { count: 'exact' })
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
    const paidItemsMap = new Map<string, any>()
    allPaidItems.forEach((item: any) => {
      paidItemsMap.set(item.line_item_id, item)
    })
    console.log(`[pending-items] Found ${paidLineItemIds.size} already paid line items`)
    console.log(`[pending-items] Total eligible items before filtering paid: ${lineItems.length}`)

      // Filter out paid items if includePaid is false
      let itemsToProcess = lineItems || []
      if (!includePaid) {
        itemsToProcess = lineItems?.filter((item: any) => !paidLineItemIds.has(item.line_item_id)) || []
        console.log(`[pending-items] Items after filtering paid: ${itemsToProcess.length}`)
      } else {
        console.log(`[pending-items] Including paid items, total: ${itemsToProcess.length}`)
      }

      // Get product titles and payout settings
      const productIds = [...new Set(itemsToProcess.map((item: any) => item.product_id).filter(Boolean))]
      
      const { data: products } = await supabase
        .from("products")
        .select("product_id, name")
        .in("product_id", productIds)

      const { data: payoutSettings } = await supabase
        .from("product_vendor_payouts")
        .select("product_id, vendor_name, payout_amount, is_percentage")
        .in("product_id", productIds)
        .eq("vendor_name", vendorName)

      const productMap = new Map<string, any>()
      products?.forEach((product: any) => {
        if (product.product_id) {
          productMap.set(product.product_id, product.name || 'Unknown Product')
        }
      })

      const payoutMap = new Map<string, any>()
      payoutSettings?.forEach((setting: any) => {
        payoutMap.set(setting.product_id, setting)
      })

      // Build response - include ALL items, even with $0 price
      const data = itemsToProcess.map((item: any) => {
        let itemPrice = Number(item.price || 0)
        const orderCurrency = item.orders?.currency_code || 'USD'
        const currencyUpper = orderCurrency.toUpperCase()
        
        // Only convert to USD if the source currency is NOT USD
        if (currencyUpper === 'GBP') {
          itemPrice = convertGBPToUSD(itemPrice)
        } else if (currencyUpper === 'NIS' || currencyUpper === 'ILS') {
          itemPrice = convertNISToUSD(itemPrice)
        }
        
        // Get payout settings for this specific product
        const setting = payoutMap.get(item.product_id)
        const payoutAmount = setting ? Number(setting.payout_amount) : 25
        const isPercentage = setting ? Boolean(setting.is_percentage) : true
        
        const orderDate = new Date(item.created_at)
        const october2025 = new Date('2025-10-01')

        // Apply historical adjustment: Pre-Oct 2025 (Historical price is always USD)
        if (orderDate < october2025) {
          itemPrice = 40.00
        }

        let calculatedPayout = isPercentage 
          ? (itemPrice * payoutAmount / 100)
          : payoutAmount
        
        // Apply $10 minimum for orders before October 2025 (Minimum is always USD)
        if (orderDate < october2025 && calculatedPayout < 10) {
          calculatedPayout = 10
        }
        
        const paidItem = paidItemsMap.get(item.line_item_id)
        return {
          line_item_id: item.line_item_id,
          order_id: item.order_id,
          order_name: item.order_name,
          product_id: item.product_id,
          product_title: productMap.get(item.product_id) || item.name || 'Unknown Product',
          price: itemPrice,
          created_at: item.created_at,
          payout_amount: payoutAmount,
          is_percentage: isPercentage,
          calculated_payout: calculatedPayout, // Actual payout amount (will be $0 if price is $0)
          fulfillment_status: item.fulfillment_status,
          restocked: item.restocked,
          is_paid: paidLineItemIds.has(item.line_item_id),
          payout_reference: paidItem?.payout_reference || null,
          payout_id: paidItem?.payout_id || null,
          marked_at: paidItem?.marked_at || null,
          marked_by: paidItem?.marked_by || null,
        }
      }).sort((a, b) => {
        if (a.order_id !== b.order_id) {
          return a.order_id.localeCompare(b.order_id)
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })

      console.log(`[pending-items] Returning ${data.length} line items for ${vendorName}`)
      console.log(`[pending-items] Items with $0 price: ${data.filter((item: any) => item.price === 0).length}`)
      console.log(`[pending-items] Items with $0 calculated payout: ${data.filter((item: any) => item.calculated_payout === 0).length}`)

      return NextResponse.json({ lineItems: data })
  } catch (error: any) {
    console.error("Error in pending line items API:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
