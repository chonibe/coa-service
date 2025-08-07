import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createPayout } from "@/lib/stripe"

export async function POST() {
  const supabase = createClient()
  
  try {
    const body = await request.json()
    const { payoutId } = body

    if (!payoutId) {
      return NextResponse.json({ error: "Payout ID is required" }, { status: 400 })
    }

    // Get payout details from database
    const { data: payout, error: payoutError } = await supabase
      .from("vendor_payouts")
      .select("*")
      .eq("id", payoutId)
      .single()

    if (payoutError || !payout) {
      console.error("Error fetching payout:", payoutError)
      return NextResponse.json({ error: "Payout not found" }, { status: 404 })
    }

    // Check if payout has already been processed via Stripe
    if (payout.stripe_transfer_id) {
      return NextResponse.json({
        message: "Payout has already been processed via Stripe",
        transferId: payout.stripe_transfer_id,
      })
    }

    // Get vendor details
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("*")
      .eq("vendor_name", payout.vendor_name)
      .single()

    if (vendorError || !vendor) {
      console.error("Error fetching vendor:", vendorError)
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Check if vendor has a Stripe account and onboarding is complete
    if (!vendor.stripe_account_id || !vendor.stripe_onboarding_complete) {
      return NextResponse.json(
        {
          error: "Vendor does not have a completed Stripe account setup",
          stripeAccountId: vendor.stripe_account_id,
          onboardingComplete: vendor.stripe_onboarding_complete,
        },
        { status: 400 },
      )
    }

    // Process the payout via Stripe
    const result = await createPayout(
      vendor.stripe_account_id,
      payout.amount,
      "usd", // Assuming USD as currency
      {
        payout_id: payout.id,
        vendor_name: payout.vendor_name,
        reference: payout.reference || `payout-${payout.id}`,
      },
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Update payout record with Stripe transfer ID
    const { error: updateError } = await supabase
      .from("vendor_payouts")
      .update({
        stripe_transfer_id: result.transferId,
        status: "processing", // Will be updated to 'completed' by webhook
        payment_method: "stripe",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payoutId)

    if (updateError) {
      console.error("Error updating payout with Stripe transfer ID:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      transferId: result.transferId,
      message: "Payout processed successfully via Stripe",
    })
  } catch (error: any) {
    console.error("Error in process Stripe payout API:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
