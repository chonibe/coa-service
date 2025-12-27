import { NextRequest, NextResponse } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { getAdminEmailFromCookieStore } from "@/lib/admin-session"
import { createClient } from "@/lib/supabase/server"
import { validatePayout, ensureDataIntegrity } from "@/lib/payout-validator"
import { calculateVendorPayout, calculateLineItemPayout } from "@/lib/payout-calculator"
import { logAdminAction } from "@/lib/audit-logger"
import crypto from "crypto"

interface MarkPaidRequest {
  lineItemIds?: string[]
  orderIds?: string[]
  vendorName?: string
  payoutReference?: string
  createPayoutRecord?: boolean
  skipValidation?: boolean
}

export async function POST(request: NextRequest) {
  console.log("Mark paid API called")
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    console.log("Auth failed:", auth)
    return auth.response
  }

  const adminEmail = getAdminEmailFromCookieStore(request.cookies)
  console.log("Admin email:", adminEmail)
  if (!adminEmail) {
    return NextResponse.json({ error: "Admin email not found" }, { status: 401 })
  }

  try {
    const body: MarkPaidRequest = await request.json()
    console.log("Request body:", body)
    const {
      lineItemIds = [],
      orderIds = [],
      vendorName,
      payoutReference,
      createPayoutRecord = false,
      skipValidation = false,
    } = body

    if (lineItemIds.length === 0 && orderIds.length === 0) {
      return NextResponse.json(
        { error: "Either lineItemIds or orderIds must be provided" },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // If orderIds provided, fetch line items for those orders
    let finalLineItemIds = [...lineItemIds]
    if (orderIds.length > 0) {
      if (!vendorName) {
        return NextResponse.json(
          { error: "vendorName is required when using orderIds" },
          { status: 400 }
        )
      }

      const { data: orderLineItems, error: orderError } = await supabase
        .from("order_line_items_v2")
        .select("line_item_id")
        .in("order_id", orderIds)
        .eq("vendor_name", vendorName)
        .eq("status", "active")
        .eq("fulfillment_status", "fulfilled")

      if (orderError) {
        return NextResponse.json(
          { error: `Failed to fetch line items: ${orderError.message}` },
          { status: 500 }
        )
      }

      if (!orderLineItems || orderLineItems.length === 0) {
        return NextResponse.json(
          { error: "No fulfilled line items found for the specified orders" },
          { status: 400 }
        )
      }

      finalLineItemIds = [
        ...new Set([...finalLineItemIds, ...orderLineItems.map((item) => item.line_item_id)]),
      ]
    }

    if (finalLineItemIds.length === 0) {
      return NextResponse.json(
        { error: "No line items to mark as paid" },
        { status: 400 }
      )
    }

    // Validate payout if not skipping
    if (!skipValidation) {
      const validationResult = await validatePayout(
        {
          lineItemIds: finalLineItemIds,
          vendorName,
          checkDuplicates: true,
          checkFulfillmentStatus: true,
        },
        supabase
      )

      if (!validationResult.valid) {
        return NextResponse.json(
          {
            error: "Validation failed",
            errors: validationResult.errors,
            warnings: validationResult.warnings,
          },
          { status: 400 }
        )
      }

      // Check data integrity
      const integrityResult = await ensureDataIntegrity(finalLineItemIds, supabase)
      if (!integrityResult.valid) {
        return NextResponse.json(
          {
            error: "Data integrity check failed",
            errors: integrityResult.errors,
          },
          { status: 400 }
        )
      }
    }

    // Fetch line items to calculate payout amounts
    const { data: lineItems, error: fetchError } = await supabase
      .from("order_line_items_v2")
      .select("line_item_id, order_id, product_id, price, vendor_name")
      .in("line_item_id", finalLineItemIds)

    if (fetchError || !lineItems) {
      return NextResponse.json(
        { error: `Failed to fetch line items: ${fetchError?.message}` },
        { status: 500 }
      )
    }

    // Get payout settings for products
    const productIds = [...new Set(lineItems.map((item) => item.product_id))]
    const vendorNames = [...new Set(lineItems.map((item) => item.vendor_name).filter(Boolean))]

    if (vendorNames.length > 1) {
      return NextResponse.json(
        { error: "Line items must belong to the same vendor" },
        { status: 400 }
      )
    }

    const vendorNameToUse = vendorNames[0] || vendorName
    if (!vendorNameToUse) {
      return NextResponse.json(
        { error: "Unable to determine vendor name" },
        { status: 400 }
      )
    }

    const { data: payoutSettings } = await supabase
      .from("product_vendor_payouts")
      .select("product_id, payout_amount, is_percentage")
      .eq("vendor_name", vendorNameToUse)
      .in("product_id", productIds)

    // Create payout record if requested
    let payoutId: number | null = null
    if (createPayoutRecord) {
      const totalAmount = lineItems.reduce((sum, item) => {
        const setting = payoutSettings?.find((s) => s.product_id === item.product_id)
        const payoutAmount = calculateLineItemPayout({
          price: Number(item.price),
          payout_amount: setting?.payout_amount ?? null,
          is_percentage: setting?.is_percentage ?? null,
        })
        return sum + payoutAmount
      }, 0)

      const reference = payoutReference || `MANUAL-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`

      const { data: payoutData, error: payoutError } = await supabase
        .from("vendor_payouts")
        .insert({
          vendor_name: vendorNameToUse,
          amount: totalAmount,
          status: "completed",
          payout_date: new Date().toISOString(),
          reference,
          product_count: finalLineItemIds.length,
          payment_method: "manual",
          notes: `Manually marked as paid by ${adminEmail}`,
          processed_by: adminEmail,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (payoutError) {
        return NextResponse.json(
          { error: `Failed to create payout record: ${payoutError.message}` },
          { status: 500 }
        )
      }

      payoutId = payoutData.id
    }

    // Mark line items as paid
    const now = new Date().toISOString()
    const payoutItems = lineItems.map((item) => {
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

    // Insert or update payout items
    const { error: insertError } = await supabase.from("vendor_payout_items").upsert(
      payoutItems,
      {
        onConflict: "payout_id,line_item_id",
      }
    )

    if (insertError) {
      // If payout record was created, we should rollback
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
        action: "mark_payout_paid",
        lineItemIds: finalLineItemIds,
        orderIds,
        vendorName: vendorNameToUse,
        payoutId,
        payoutReference,
        itemsCount: finalLineItemIds.length,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Successfully marked ${finalLineItemIds.length} line item(s) as paid`,
      payoutId,
      lineItemIds: finalLineItemIds,
      vendorName: vendorNameToUse,
    })
  } catch (error: any) {
    console.error("Error in mark-paid API:", error)
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

