import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"
import { getPayPalPayoutStatus } from "@/lib/paypal/payouts"
import { notifyPayoutProcessed, notifyPayoutFailed } from "@/lib/notifications/payout-notifications"
import { sendInvoiceEmail } from "@/lib/invoices/email-service"

/**
 * PayPal Webhook Handler
 * Handles PayPal webhook events for payout status updates
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headers = request.headers

    // Verify webhook signature
    const webhookId = headers.get("paypal-transmission-id")
    const transmissionTime = headers.get("paypal-transmission-time")
    const certUrl = headers.get("paypal-cert-url")
    const authAlgo = headers.get("paypal-auth-algo")
    const transmissionSig = headers.get("paypal-transmission-sig")

    if (!webhookId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
      console.error("Missing PayPal webhook headers")
      return NextResponse.json({ error: "Invalid webhook headers" }, { status: 400 })
    }

    // Verify webhook signature (simplified - in production, verify with PayPal's certificate)
    const webhookSecret = process.env.PAYPAL_WEBHOOK_SECRET
    if (webhookSecret) {
      // Basic verification - PayPal provides a verification endpoint we should use
      // For now, we'll log and process (in production, verify signature properly)
      console.log("PayPal webhook received - signature verification should be implemented")
    }

    const event = JSON.parse(body)
    console.log("PayPal webhook event:", event.event_type)

    const supabase = createClient()

    // Handle different event types
    switch (event.event_type) {
      case "PAYMENT.PAYOUTSBATCH.SUCCESS":
        await handlePayoutSuccess(event, supabase)
        break

      case "PAYMENT.PAYOUTSBATCH.DENIED":
      case "PAYMENT.PAYOUTSBATCH.CANCELED":
        await handlePayoutFailed(event, supabase)
        break

      case "PAYMENT.PAYOUTSBATCH.PROCESSING":
        await handlePayoutProcessing(event, supabase)
        break

      default:
        console.log(`Unhandled PayPal webhook event: ${event.event_type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("Error processing PayPal webhook:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process webhook" },
      { status: 500 }
    )
  }
}

/**
 * Handle successful payout batch
 */
async function handlePayoutSuccess(event: any, supabase: ReturnType<typeof createClient>) {
  const batchId = event.resource?.batch_header?.payout_batch_id

  if (!batchId) {
    console.error("No batch ID in success event")
    return
  }

  // Find payouts with this batch ID
  const { data: payouts, error } = await supabase
    .from("vendor_payouts")
    .select("*")
    .eq("payout_batch_id", batchId)
    .in("status", ["processing", "pending"])

  if (error) {
    console.error("Error fetching payouts:", error)
    return
  }

  // Get detailed status from PayPal
  try {
    const paypalStatus = await getPayPalPayoutStatus(batchId)
    const completedTime = paypalStatus.batch_header.time_completed

    // Update each payout
    for (const payout of payouts || []) {
      await supabase
        .from("vendor_payouts")
        .update({
          status: "completed",
          payout_date: completedTime || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", payout.id)

      // Send notifications
      await notifyPayoutProcessed(payout.vendor_name, {
        vendorName: payout.vendor_name,
        amount: parseFloat(payout.amount.toString()),
        currency: payout.currency || "USD",
        payoutDate: completedTime || payout.payout_date || payout.created_at,
        reference: payout.reference || `PAY-${payout.id}`,
        invoiceNumber: payout.invoice_number || undefined,
        productCount: payout.product_count || 0,
        payoutBatchId: batchId,
        invoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/vendors/payouts/${payout.id}/invoice`,
      })

      // Send invoice email
      await sendInvoiceEmail(payout.id, payout.vendor_name)
    }
  } catch (err: any) {
    console.error("Error getting PayPal status:", err)
  }
}

/**
 * Handle failed payout batch
 */
async function handlePayoutFailed(event: any, supabase: ReturnType<typeof createClient>) {
  const batchId = event.resource?.batch_header?.payout_batch_id

  if (!batchId) {
    console.error("No batch ID in failed event")
    return
  }

  // Find payouts with this batch ID
  const { data: payouts, error } = await supabase
    .from("vendor_payouts")
    .select("*")
    .eq("payout_batch_id", batchId)
    .in("status", ["processing", "pending"])

  if (error) {
    console.error("Error fetching payouts:", error)
    return
  }

  const errorMessage = event.resource?.batch_header?.batch_status || "Payout was denied or canceled"

  // Update each payout
  for (const payout of payouts || []) {
    await supabase
      .from("vendor_payouts")
      .update({
        status: "failed",
        notes: (payout.notes || "") + ` | PayPal webhook: ${errorMessage}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payout.id)

    // Send failure notification
    await notifyPayoutFailed(payout.vendor_name, {
      vendorName: payout.vendor_name,
      amount: parseFloat(payout.amount.toString()),
      currency: payout.currency || "USD",
      reference: payout.reference || `PAY-${payout.id}`,
      errorMessage,
      payoutBatchId: batchId,
    })
  }
}

/**
 * Handle processing payout batch
 */
async function handlePayoutProcessing(event: any, supabase: ReturnType<typeof createClient>) {
  const batchId = event.resource?.batch_header?.payout_batch_id

  if (!batchId) {
    return
  }

  // Update status to processing (if not already)
  await supabase
    .from("vendor_payouts")
    .update({
      status: "processing",
      updated_at: new Date().toISOString(),
    })
    .eq("payout_batch_id", batchId)
    .in("status", ["pending"])
}

