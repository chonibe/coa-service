import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { createStripeAccount } from "@/lib/stripe"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vendorName } = body

    if (!vendorName) {
      return NextResponse.json({ error: "Vendor name is required" }, { status: 400 })
    }

    // Get vendor details from database
    const { data: vendor, error: vendorError } = await supabaseAdmin
      .from("vendors")
      .select("*")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      console.error("Error fetching vendor:", vendorError)
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Check if vendor already has a Stripe account
    if (vendor.stripe_account_id) {
      return NextResponse.json({
        message: "Vendor already has a Stripe account",
        accountId: vendor.stripe_account_id,
        onboardingComplete: vendor.stripe_onboarding_complete,
      })
    }

    // Create Stripe account
    const email =
      vendor.contact_email || vendor.paypal_email || `${vendorName.replace(/\s+/g, "-").toLowerCase()}@example.com`
    const country = vendor.tax_country || "US"

    const result = await createStripeAccount(vendorName, email, country)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Update vendor record with Stripe account ID
    const { error: updateError } = await supabaseAdmin
      .from("vendors")
      .update({
        stripe_account_id: result.accountId,
        stripe_account_created_at: new Date().toISOString(),
        stripe_last_updated_at: new Date().toISOString(),
      })
      .eq("vendor_name", vendorName)

    if (updateError) {
      console.error("Error updating vendor with Stripe account ID:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      accountId: result.accountId,
      message: "Stripe account created successfully",
    })
  } catch (error: any) {
    console.error("Error in create Stripe account API:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
