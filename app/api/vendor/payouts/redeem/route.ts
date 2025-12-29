import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createPayPalPayout, isValidPayPalEmail } from "@/lib/paypal/payouts"
import { notifyPayoutProcessed, notifyPayoutFailed } from "@/lib/notifications/payout-notifications"
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

    // Get all unpaid line items for this vendor using the RPC function
    const { data: lineItems, error: lineItemsError } = await supabase.rpc("get_vendor_pending_line_items", {
      p_vendor_name: vendorName,
    })

    if (lineItemsError) {
      console.error("[redeem] Error fetching line items:", lineItemsError)
      return NextResponse.json(
        { error: `Failed to fetch line items: ${lineItemsError.message}` },
        { status: 500 }
      )
    }

    console.log(`[redeem] Fetched ${lineItems?.length || 0} pending line items for ${vendorName}`)

    // Filter to only fulfilled items - vendors can only request payout for fulfilled items
    const fulfilledItems = (lineItems || []).filter((item: any) => item.fulfillment_status === 'fulfilled')
    
    console.log(`[redeem] Filtered to ${fulfilledItems.length} fulfilled items (out of ${lineItems?.length || 0} total)`)

    if (!fulfilledItems || fulfilledItems.length === 0) {
      console.log(`[redeem] No fulfilled items to redeem for ${vendorName}`)
      return NextResponse.json({ 
        error: "No pending payouts to redeem. Only fulfilled items are eligible for payout requests. You have unfulfilled items that need to be fulfilled first." 
      }, { status: 400 })
    }

    // Calculate total payout amount using fulfilled items only
    // DISABLED: Custom payout settings - always use 25% of item price
    let totalAmount = 0
    fulfilledItems.forEach((item: any) => {
      const price = typeof item.price === "string" ? Number.parseFloat(item.price || "0") : item.price || 0
      totalAmount += (price * 25) / 100 // Always 25% of item price
    })

    // Generate a unique reference number
    const reference = `REDEEM-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`

    // Generate invoice number (will be used when approved)
    const invoiceNumber = `INV-${Date.now()}-${vendorName.substring(0, 3).toUpperCase()}`

    // Create payout record with "requested" status - waiting for admin approval
    const { data: payoutRecord, error: payoutError } = await supabase
      .from("vendor_payouts")
      .insert({
        vendor_name: vendorName,
        amount: totalAmount,
        status: "requested", // Changed from "pending" to "requested" - requires admin approval
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

    // Associate line items with this payout request (only fulfilled items)
    const payoutItems = fulfilledItems.map((item: any) => ({
      payout_id: payoutId,
      line_item_id: item.line_item_id,
      order_id: item.order_id,
      product_id: item.product_id,
      amount: item.is_percentage ? (item.price * item.payout_amount) / 100 : item.payout_amount,
      created_at: new Date().toISOString(),
    }))

    const { error: insertError } = await supabase.from("vendor_payout_items").insert(payoutItems)

    if (insertError) {
      // Rollback payout record
      await supabase.from("vendor_payouts").delete().eq("id", payoutId)
      return NextResponse.json(
        { error: `Failed to create payout items: ${insertError.message}` },
        { status: 500 }
      )
    }

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

