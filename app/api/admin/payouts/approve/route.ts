import { NextRequest, NextResponse } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { getAdminEmailFromCookieStore } from "@/lib/admin-session"
import { createClient } from "@/lib/supabase/server"
import { createPayPalPayout, isValidPayPalEmail } from "@/lib/paypal/payouts"
import { notifyPayoutProcessed, notifyPayoutFailed } from "@/lib/notifications/payout-notifications"

export async function POST(request: NextRequest) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  const adminEmail = getAdminEmailFromCookieStore(request.cookies)
  if (!adminEmail) {
    return NextResponse.json({ error: "Admin email not found" }, { status: 401 })
  }

  const supabase = createClient()

  try {
    const body = await request.json()
    const { payoutId, action } = body // action: "approve" or "reject"

    if (!payoutId || !action) {
      return NextResponse.json(
        { error: "payoutId and action are required" },
        { status: 400 }
      )
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "action must be 'approve' or 'reject'" },
        { status: 400 }
      )
    }

    // Get the payout record
    const { data: payout, error: payoutError } = await supabase
      .from("vendor_payouts")
      .select("*")
      .eq("id", payoutId)
      .single()

    if (payoutError || !payout) {
      return NextResponse.json(
        { error: "Payout not found" },
        { status: 404 }
      )
    }

    // Verify payout is in "requested" status
    if (payout.status !== "requested") {
      return NextResponse.json(
        { error: `Payout is not in requested status. Current status: ${payout.status}` },
        { status: 400 }
      )
    }

    if (action === "reject") {
      // Reject the payout request
      const { error: updateError } = await supabase
        .from("vendor_payouts")
        .update({
          status: "rejected",
          notes: `Rejected by ${adminEmail} on ${new Date().toISOString()}. ${body.reason || "No reason provided"}`,
          processed_by: adminEmail,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payoutId)

      if (updateError) {
        return NextResponse.json(
          { error: `Failed to reject payout: ${updateError.message}` },
          { status: 500 }
        )
      }

      // Remove payout items association (so line items can be requested again)
      await supabase
        .from("vendor_payout_items")
        .delete()
        .eq("payout_id", payoutId)

      return NextResponse.json({
        success: true,
        message: "Payout request rejected",
        payoutId,
        status: "rejected",
      })
    }

    // Approve and process the payout
    // Get vendor PayPal email
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("paypal_email")
      .eq("vendor_name", payout.vendor_name)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      )
    }

    if (!vendor.paypal_email) {
      return NextResponse.json(
        { error: "Vendor PayPal email not configured" },
        { status: 400 }
      )
    }

    if (!isValidPayPalEmail(vendor.paypal_email)) {
      return NextResponse.json(
        { error: "Invalid PayPal email format" },
        { status: 400 }
      )
    }

    // Update status to processing
    await supabase
      .from("vendor_payouts")
      .update({
        status: "processing",
        notes: `Approved and processed by ${adminEmail} on ${new Date().toISOString()}`,
        processed_by: adminEmail,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payoutId)

    // Process PayPal payout
    try {
      const paypalResponse = await createPayPalPayout([
        {
          email: vendor.paypal_email,
          amount: parseFloat(payout.amount.toString()),
          currency: payout.currency || "USD",
          note: `Payout for ${payout.product_count || 0} products - ${payout.reference}`,
          senderItemId: `PAYOUT-${payoutId}`,
        },
      ])

      const batchId = paypalResponse.batch_header.payout_batch_id
      const batchStatus = paypalResponse.batch_header.batch_status

      // Update payout with batch ID
      const { data: updatedPayout } = await supabase
        .from("vendor_payouts")
        .update({
          payout_batch_id: batchId,
          status: batchStatus === "PENDING" ? "processing" : batchStatus.toLowerCase(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", payoutId)
        .select()
        .single()

      // If status is SUCCESS, send notification
      if (batchStatus === "SUCCESS" && updatedPayout) {
        await notifyPayoutProcessed(payout.vendor_name, {
          vendorName: payout.vendor_name,
          amount: parseFloat(payout.amount.toString()),
          currency: payout.currency || "USD",
          payoutDate: updatedPayout.payout_date || updatedPayout.created_at,
          reference: updatedPayout.reference || `PAY-${payoutId}`,
          invoiceNumber: updatedPayout.invoice_number || undefined,
          productCount: updatedPayout.product_count || 0,
          payoutBatchId: batchId,
          invoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/vendors/payouts/${payoutId}/invoice`,
        })
      }

      return NextResponse.json({
        success: true,
        message: "Payout approved and processed successfully",
        payoutId,
        amount: payout.amount,
        reference: payout.reference,
        payoutBatchId: batchId,
        status: batchStatus.toLowerCase(),
      })
    } catch (paypalError: any) {
      console.error("PayPal payout error:", paypalError)

      // Mark payout as failed
      await supabase
        .from("vendor_payouts")
        .update({
          status: "failed",
          notes: `PayPal payout failed: ${paypalError.message}. Approved by ${adminEmail}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payoutId)

      // Send failure notification
      await notifyPayoutFailed(payout.vendor_name, {
        vendorName: payout.vendor_name,
        amount: parseFloat(payout.amount.toString()),
        currency: payout.currency || "USD",
        reference: payout.reference || `PAY-${payoutId}`,
        errorMessage: paypalError.message || "PayPal payout failed",
      })

      return NextResponse.json(
        {
          success: false,
          error: `PayPal payout failed: ${paypalError.message}`,
          payoutId,
          note: "Payout was approved but payment processing failed. Please check PayPal and retry.",
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Error in approve payout API:", error)
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    )
  }
}



