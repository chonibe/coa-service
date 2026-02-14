import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createPayPalPayout, isValidPayPalEmail } from "@/lib/paypal/payouts"
import { notifyPayoutProcessed, notifyPayoutFailed } from "@/lib/notifications/payout-notifications"
import { MINIMUM_PAYOUT_AMOUNT } from "@/lib/payout-calculator"
import { calculateVendorBalance, invalidateVendorBalanceCache } from "@/lib/vendor-balance-calculator"
import { recordPayoutWithdrawal } from "@/lib/banking/payout-withdrawal"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const cookieStore = cookies()
  const vendorName = getVendorFromCookieStore(cookieStore)

  if (!vendorName) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    // Get vendor details including PayPal email
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("paypal_email")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    if (!vendor.paypal_email) {
      return NextResponse.json(
        { error: "PayPal email not configured. Please update your settings first." },
        { status: 400 }
      )
    }

    if (!isValidPayPalEmail(vendor.paypal_email)) {
      return NextResponse.json(
        { error: "Invalid PayPal email format. Please update your PayPal email in settings." },
        { status: 400 }
      )
    }

    // 1. Get ledger balance (single source of truth)
    const balance = await calculateVendorBalance(vendorName, supabase)
    console.log(`[redeem] Ledger balance for ${vendorName}: $${balance.available_balance.toFixed(2)}`)

    // 2. Validate minimum payout threshold against ledger balance
    if (balance.available_balance < MINIMUM_PAYOUT_AMOUNT) {
      return NextResponse.json({
        error: `Minimum payout amount is $${MINIMUM_PAYOUT_AMOUNT}. Your current balance is $${balance.available_balance.toFixed(2)}. Please wait until you have enough earnings.`
      }, { status: 400 })
    }

    // 3. Race condition guard: check if vendor already has a pending payout request
    const { data: existingPayout, error: existingPayoutError } = await supabase
      .from("vendor_payouts")
      .select("id, amount, created_at")
      .eq("vendor_name", vendorName)
      .eq("status", "requested")
      .maybeSingle()

    if (existingPayoutError) {
      console.error("[redeem] Error checking existing payouts:", existingPayoutError)
    }

    if (existingPayout) {
      return NextResponse.json({
        error: "You already have a pending payout request. Please wait for it to be processed before requesting another.",
        existingPayoutId: existingPayout.id,
        existingAmount: existingPayout.amount,
      }, { status: 409 })
    }

    // 4. LEGACY: Get fulfilled line items via RPC for audit trail only (which items are included).
    // @deprecated — This RPC is used for display/audit only, NOT for money calculations.
    // The authoritative balance comes from the ledger (calculateVendorBalance above).
    const { data: lineItems, error: lineItemsError } = await supabase.rpc("get_vendor_pending_line_items", {
      p_vendor_name: vendorName,
    })

    if (lineItemsError) {
      console.error("[redeem] Error fetching line items for audit:", lineItemsError)
      // Non-fatal: we proceed with the payout using the ledger balance
      // but log the error for investigation
    }

    const fulfilledItems = (lineItems || []).filter((item: any) => item.fulfillment_status === 'fulfilled')
    console.log(`[redeem] Audit trail: ${fulfilledItems.length} fulfilled items for ${vendorName}`)

    // 5. Use the ledger balance as the payout amount (NOT recalculated from line items)
    const totalAmount = balance.available_balance

    // Build audit trail of which line items are included in this payout
    const payoutItems = fulfilledItems.map((item: any) => ({
      line_item_id: item.line_item_id,
      order_id: item.order_id,
      product_id: item.product_id,
      amount: 0, // Individual amounts are tracked in the ledger, not recalculated here
      created_at: new Date().toISOString(),
    }))

    // Generate a unique reference number
    const reference = `REDEEM-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`

    // Generate invoice number (will be used when approved)
    const invoiceNumber = `INV-${Date.now()}-${vendorName.substring(0, 3).toUpperCase()}`

    // 6. Create payout record with "requested" status - waiting for admin approval
    const { data: payoutRecord, error: payoutError } = await supabase
      .from("vendor_payouts")
      .insert({
        vendor_name: vendorName,
        amount: totalAmount,
        status: "requested",
        payment_method: "paypal",
        reference,
        product_count: fulfilledItems.length,
        currency: "USD",
        invoice_number: invoiceNumber,
        tax_rate: 0,
        tax_amount: 0,
        notes: "Redeemed by vendor - awaiting admin approval",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (payoutError || !payoutRecord) {
      return NextResponse.json(
        { error: `Failed to create payout request: ${payoutError?.message}` },
        { status: 500 }
      )
    }

    const payoutId = payoutRecord.id

    // 7. Associate line items with this payout request (audit trail)
    if (payoutItems.length > 0) {
      const payoutItemsWithId = payoutItems.map(item => ({
        ...item,
        payout_id: payoutId
      }))

      const { error: insertError } = await supabase.from("vendor_payout_items").insert(payoutItemsWithId)

      if (insertError) {
        // Rollback payout record
        await supabase.from("vendor_payouts").delete().eq("id", payoutId)
        return NextResponse.json(
          { error: `Failed to create payout items: ${insertError.message}` },
          { status: 500 }
        )
      }
    }

    // 8. Record withdrawal in the ledger
    const withdrawalResult = await recordPayoutWithdrawal(vendorName, payoutId, totalAmount, supabase)
    if (!withdrawalResult.success) {
      console.error("[redeem] Failed to record ledger withdrawal:", withdrawalResult.error)
      // The payout record exists, but the ledger withdrawal failed — log for manual reconciliation
      // We do NOT rollback the payout record because the admin still needs to see and process it
    }

    // 9. Invalidate balance cache so subsequent reads reflect the withdrawal
    invalidateVendorBalanceCache(vendorName)

    // Return success - payout request created, waiting for admin approval
    return NextResponse.json({
      success: true,
      message: "Payout request submitted successfully",
      payoutId,
      amount: totalAmount,
      reference,
      itemsCount: fulfilledItems.length,
      paypalEmail: vendor.paypal_email,
      status: "requested",
      note: "Your payout request has been submitted and is awaiting admin approval. You will be notified once it's processed.",
    })
  } catch (error: any) {
    console.error("Error in vendor redeem API:", error)
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

