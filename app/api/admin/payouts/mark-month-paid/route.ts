import { NextRequest, NextResponse } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { getAdminEmailFromCookieStore } from "@/lib/admin-session"
import { createClient } from "@/lib/supabase/server"
import { validatePayout, ensureDataIntegrity } from "@/lib/payout-validator"
import { calculateVendorPayout, calculateLineItemPayout } from "@/lib/payout-calculator"
import { logAdminAction } from "@/lib/audit-logger"
import crypto from "crypto"

interface MarkMonthPaidRequest {
  vendorName: string
  year: number
  month: number // 1-12
  payoutReference?: string
  createPayoutRecord?: boolean
}

export async function POST(request: NextRequest) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  const adminEmail = getAdminEmailFromCookieStore(request.cookies)
  if (!adminEmail) {
    return NextResponse.json({ error: "Admin email not found" }, { status: 401 })
  }

  try {
    const body: MarkMonthPaidRequest = await request.json()
    const { vendorName, year, month, payoutReference, createPayoutRecord = false } = body

    if (!vendorName || !year || !month) {
      return NextResponse.json(
        { error: "vendorName, year, and month are required" },
        { status: 400 }
      )
    }

    if (month < 1 || month > 12) {
      return NextResponse.json({ error: "Month must be between 1 and 12" }, { status: 400 })
    }

    const supabase = createClient()

    // Calculate date range for the month
    // Start: first day of the month at 00:00:00
    const startDate = new Date(year, month - 1, 1).toISOString()
    // End: last day of the month at 23:59:59.999
    // new Date(year, month, 0) gives last day of (month-1) in 0-indexed months
    // So for 1-indexed month, use month (which becomes month-1 in 0-indexed) + 1 = month in 0-indexed
    // Then day 0 of next month = last day of current month
    const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString()

    // Get all fulfilled line items for this vendor in this month that are not yet paid
    // Match the same logic as pending-items: fulfilled/partially_fulfilled OR items with active edition numbers
    // First, get items that match fulfillment/edition criteria
    const { data: allItems, error: allItemsError } = await supabase
      .from("order_line_items_v2")
      .select("*")
      .eq("vendor_name", vendorName)
      .eq("status", "active")
      .eq("restocked", false) // Exclude restocked items
      .or("fulfillment_status.in.(fulfilled,partially_fulfilled),and(edition_number.not.is.null,status.eq.active)")
      .gte("created_at", startDate)
      .lte("created_at", endDate)

    if (allItemsError) {
      return NextResponse.json(
        { error: `Failed to fetch line items: ${allItemsError.message}` },
        { status: 500 }
      )
    }

    if (!allItems || allItems.length === 0) {
      return NextResponse.json(
        { 
          error: `No eligible line items found for ${year}-${String(month).padStart(2, "0")}`,
          details: `Checked for items with fulfillment_status='fulfilled' or 'partially_fulfilled', or items with active edition numbers, between ${startDate} and ${endDate}`
        },
        { status: 400 }
      )
    }

    // Filter out refunded items (only include null or 'none')
    let filteredItems = (allItems || []).filter(
      (item: any) => !item.refund_status || item.refund_status === 'none'
    )

    // Separate items into two groups (same as pending-items):
    // 1. Items with active edition numbers (always include these, but exclude cancelled orders)
    // 2. Items that need financial_status check (fulfilled/partially_fulfilled)
    const itemsWithActiveEdition = filteredItems.filter((item: any) => 
      item.edition_number !== null && item.edition_number !== undefined && item.status === 'active'
    )
    const itemsNeedingFinancialCheck = filteredItems.filter((item: any) => 
      !(item.edition_number !== null && item.edition_number !== undefined && item.status === 'active')
    )

    // Get all order IDs to check financial_status
    const allOrderIds = [...new Set(filteredItems.map((item: any) => item.order_id))]
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, financial_status")
      .in("id", allOrderIds)

    if (ordersError) {
      return NextResponse.json(
        { error: `Failed to fetch orders: ${ordersError.message}` },
        { status: 500 }
      )
    }

    // Exclude cancelled orders (financial_status = 'voided')
    const cancelledOrderIds = new Set(
      orders?.filter((order: any) => order.financial_status === 'voided').map((order: any) => order.id) || []
    )

    // Filter items with active edition numbers - exclude cancelled orders
    const validItemsWithActiveEdition = itemsWithActiveEdition.filter((item: any) => 
      !cancelledOrderIds.has(item.order_id)
    )

    // Filter items needing financial_status check - only include orders with financial_status = 'paid', 'refunded', or 'complete'
    const validOrderIds = new Set(
      orders?.filter((order: any) => 
        (order.financial_status === 'paid' || 
         order.financial_status === 'refunded' || 
         order.financial_status === 'complete') &&
        order.financial_status !== 'voided'
      ).map((order: any) => order.id) || []
    )

    const validItemsFromFinancialCheck = itemsNeedingFinancialCheck.filter((item: any) => 
      validOrderIds.has(item.order_id)
    )

    // Combine both groups (same as pending-items logic)
    const lineItems = [...validItemsWithActiveEdition, ...validItemsFromFinancialCheck]

    console.log(`[mark-month-paid] Found ${lineItems.length} eligible items for ${vendorName} in ${year}-${String(month).padStart(2, "0")}`)
    console.log(`[mark-month-paid] Date range: ${startDate} to ${endDate}`)
    console.log(`[mark-month-paid] Items with active edition: ${validItemsWithActiveEdition.length}`)
    console.log(`[mark-month-paid] Items from financial check: ${validItemsFromFinancialCheck.length}`)

    if (!lineItems || lineItems.length === 0) {
      console.error(`[mark-month-paid] No eligible items found for ${vendorName} in ${year}-${String(month).padStart(2, "0")}`)
      return NextResponse.json(
        { 
          error: `No eligible line items found for ${year}-${String(month).padStart(2, "0")}`,
          details: `Checked for items with fulfillment_status='fulfilled' or 'partially_fulfilled', or items with active edition numbers, between ${startDate} and ${endDate}. Found ${allItems?.length || 0} total items before filtering.`
        },
        { status: 400 }
      )
    }

    // Check which items are already paid
    const lineItemIds = lineItems.map((item) => item.line_item_id)
    const { data: paidItems, error: paidError } = await supabase
      .from("vendor_payout_items")
      .select("line_item_id")
      .in("line_item_id", lineItemIds)

    if (paidError) {
      return NextResponse.json(
        { error: `Failed to check paid items: ${paidError.message}` },
        { status: 500 }
      )
    }

    const paidItemIds = new Set(paidItems?.map((item) => item.line_item_id) || [])
    const unpaidLineItems = lineItems.filter((item) => !paidItemIds.has(item.line_item_id))

    console.log(`[mark-month-paid] Found ${paidItemIds.size} already paid items`)
    console.log(`[mark-month-paid] Unpaid items: ${unpaidLineItems.length} out of ${lineItems.length} total`)

    if (unpaidLineItems.length === 0) {
      console.log(`[mark-month-paid] All items for ${vendorName} in ${year}-${String(month).padStart(2, "0")} are already paid`)
      return NextResponse.json(
        { error: "All items for this month are already paid" },
        { status: 400 }
      )
    }

    // Get payout settings
    const productIds = [...new Set(unpaidLineItems.map((item) => item.product_id))]
    const { data: payoutSettings } = await supabase
      .from("product_vendor_payouts")
      .select("*")
      .in("product_id", productIds)
      .eq("vendor_name", vendorName)

    // Validate and calculate totals
    const totalAmount = unpaidLineItems.reduce((sum, item) => {
      const setting = payoutSettings?.find((s) => s.product_id === item.product_id)
      const payoutAmount = calculateLineItemPayout({
        price: Number(item.price),
        payout_amount: setting?.payout_amount ?? null,
        is_percentage: setting?.is_percentage ?? null,
      })
      return sum + payoutAmount
    }, 0)

    // Create payout record if requested
    let payoutId: number | null = null
    if (createPayoutRecord) {
      const reference =
        payoutReference ||
        `PAY-${year}-${String(month).padStart(2, "0")}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`

      const { data: newPayout, error: payoutError } = await supabase
        .from("vendor_payouts")
        .insert({
          vendor_name: vendorName,
          amount: totalAmount,
          currency: "USD",
          status: "paid",
          payout_date: new Date().toISOString(),
          reference,
          product_count: unpaidLineItems.length,
          payment_method: "manual",
          notes: `Bulk payment for ${year}-${String(month).padStart(2, "0")}`,
          processed_by: adminEmail,
        })
        .select()
        .single()

      if (payoutError) {
        return NextResponse.json(
          { error: `Failed to create payout record: ${payoutError.message}` },
          { status: 500 }
        )
      }

      payoutId = newPayout.id
    }

    // Mark line items as paid
    const now = new Date().toISOString()
    const payoutItems = unpaidLineItems.map((item) => {
      const setting = payoutSettings?.find((s) => s.product_id === item.product_id)
      const payoutAmount = calculateLineItemPayout({
        price: Number(item.price),
        payout_amount: setting?.payout_amount ?? null,
        is_percentage: setting?.is_percentage ?? null,
      })

      return {
        payout_id: payoutId,
        line_item_id: item.line_item_id,
        order_id: item.order_id,
        product_id: item.product_id,
        amount: payoutAmount,
        manually_marked_paid: true,
        marked_by: adminEmail,
        marked_at: now,
        payout_reference: payoutReference || null,
        created_at: now,
      }
    })

    // Insert payout items
    const { error: insertError } = await supabase.from("vendor_payout_items").upsert(
      payoutItems,
      {
        onConflict: "payout_id,line_item_id",
      }
    )

    if (insertError) {
      if (payoutId) {
        await supabase.from("vendor_payouts").delete().eq("id", payoutId)
      }
      return NextResponse.json(
        { error: `Failed to mark items as paid: ${insertError.message}` },
        { status: 500 }
      )
    }

    // Log admin action
    await logAdminAction({
      adminEmail,
      actionType: "update",
      details: {
        action: "mark_month_paid",
        vendorName,
        year,
        month,
        payoutId,
        payoutReference,
        itemsCount: unpaidLineItems.length,
        totalAmount,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Successfully marked ${unpaidLineItems.length} line item(s) for ${year}-${String(month).padStart(2, "0")} as paid`,
      payoutId,
      lineItemIds: unpaidLineItems.map((item) => item.line_item_id),
      vendorName,
      itemsCount: unpaidLineItems.length,
      totalAmount,
    })
  } catch (error: any) {
    console.error("Error in mark-month-paid API:", error)
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

