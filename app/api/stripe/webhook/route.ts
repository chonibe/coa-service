import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin } from "/dev/null"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const sig = request.headers.get("stripe-signature") || ""

    let event

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret || "")
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`)
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      case "account.updated":
        const account = event.data.object as Stripe.Account
        await handleAccountUpdated(account)
        break
      case "transfer.created":
        const transfer = event.data.object as Stripe.Transfer
        await handleTransferCreated(transfer)
        break
      case "transfer.failed":
        const failedTransfer = event.data.object as Stripe.Transfer
        await handleTransferFailed(failedTransfer)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("Error in Stripe webhook handler:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  try {
    // Find the vendor with this Stripe account ID
    const { data: vendor, error } = await supabaseAdmin
      .from("vendors")
      .select("vendor_name")
      .eq("stripe_account_id", account.id)
      .single()

    if (error || !vendor) {
      console.error("Error finding vendor for Stripe account:", error)
      return
    }

    // Update vendor record with latest Stripe account status
    const isOnboardingComplete =
      account.details_submitted && account.payouts_enabled && !account.requirements?.currently_due?.length

    await supabaseAdmin
      .from("vendors")
      .update({
        stripe_onboarding_complete: isOnboardingComplete,
        stripe_payouts_enabled: account.payouts_enabled,
        stripe_last_updated_at: new Date().toISOString(),
      })
      .eq("vendor_name", vendor.vendor_name)

    console.log(
      `Updated vendor ${vendor.vendor_name} with Stripe account status: ${isOnboardingComplete ? "Complete" : "Incomplete"}`,
    )
  } catch (err) {
    console.error("Error handling account.updated webhook:", err)
  }
}

async function handleTransferCreated(transfer: Stripe.Transfer) {
  try {
    // Check if this transfer is related to a vendor payout
    if (!transfer.metadata?.payout_id) {
      return
    }

    const payoutId = transfer.metadata.payout_id

    // Update the payout record with the transfer ID
    await supabaseAdmin
      .from("vendor_payouts")
      .update({
        stripe_transfer_id: transfer.id,
        status: "completed",
        payout_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", payoutId)

    console.log(`Updated payout ${payoutId} with Stripe transfer ID: ${transfer.id}`)
  } catch (err) {
    console.error("Error handling transfer.created webhook:", err)
  }
}

async function handleTransferFailed(transfer: Stripe.Transfer) {
  try {
    // Check if this transfer is related to a vendor payout
    if (!transfer.metadata?.payout_id) {
      return
    }

    const payoutId = transfer.metadata.payout_id

    // Update the payout record with the failed status
    await supabaseAdmin
      .from("vendor_payouts")
      .update({
        stripe_transfer_id: transfer.id,
        status: "failed",
        notes: `Stripe transfer failed: ${transfer.failure_message || "Unknown reason"}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payoutId)

    console.log(`Updated payout ${payoutId} with failed Stripe transfer: ${transfer.id}`)
  } catch (err) {
    console.error("Error handling transfer.failed webhook:", err)
  }
}
