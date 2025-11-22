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
    const { data: lineItems, error: lineItemsError } = await supabase
      .from("order_line_items_v2")
      .select("*")
      .eq("vendor_name", vendorName)
      .eq("status", "active")
      .eq("fulfillment_status", "fulfilled")
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .is("refund_status", null) // Exclude refunded items

    if (lineItemsError) {
      return NextResponse.json(
        { error: `Failed to fetch line items: ${lineItemsError.message}` },
        { status: 500 }
      )
    }

    if (!lineItems || lineItems.length === 0) {
      return NextResponse.json(
        { error: "No fulfilled line items found for this month" },
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

    if (unpaidLineItems.length === 0) {
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

