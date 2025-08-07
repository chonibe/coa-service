import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { retrieveAccount } from "@/lib/stripe"

export async function POST() {
  const supabase = createClient()
  
  try {
    const body = await request.json()
    const { vendorName } = body

    if (!vendorName) {
      return NextResponse.json({ error: "Vendor name is required" }, { status: 400 })
    }

    // Get vendor details from database
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("*")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      console.error("Error fetching vendor:", vendorError)
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Check if vendor has a Stripe account
    if (!vendor.stripe_account_id) {
      return NextResponse.json({
        hasStripeAccount: false,
        message: "Vendor does not have a Stripe account",
      })
    }

    // Retrieve account details from Stripe
    const result = await retrieveAccount(vendor.stripe_account_id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    const account = result.account
    const isOnboardingComplete =
      account.details_submitted && account.payouts_enabled && !account.requirements.currently_due.length

    // Update vendor record with onboarding status if it has changed
    if (isOnboardingComplete !== vendor.stripe_onboarding_complete) {
      await supabase
        .from("vendors")
        .update({
          stripe_onboarding_complete: isOnboardingComplete,
          stripe_payouts_enabled: account.payouts_enabled,
          stripe_last_updated_at: new Date().toISOString(),
        })
        .eq("vendor_name", vendorName)
    }

    return NextResponse.json({
      success: true,
      hasStripeAccount: true,
      accountId: vendor.stripe_account_id,
      isOnboardingComplete,
      payoutsEnabled: account.payouts_enabled,
      requirements: account.requirements,
      accountDetails: {
        business_type: account.business_type,
        email: account.email,
        country: account.country,
        created: account.created,
        default_currency: account.default_currency,
      },
    })
  } catch (error: any) {
    console.error("Error in check Stripe account status API:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
