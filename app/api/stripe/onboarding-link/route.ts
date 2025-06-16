import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"
import { createAccountLink, retrieveAccount } from "@/lib/stripe"
import type Stripe from "stripe"

export async function POST(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase admin client initialization failed" }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { vendorName, refreshUrl, returnUrl } = body

    if (!vendorName || !refreshUrl || !returnUrl) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Get vendor details from database
    const { data: vendor, error: vendorError } = await supabaseAdmin
      .from("vendors")
      .select("stripe_account_id")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError) {
      console.error("Vendor fetch error:", vendorError)
      return NextResponse.json({ error: vendorError.message }, { status: 400 })
    }

    if (!vendor || !vendor.stripe_account_id) {
      return NextResponse.json({ error: "No Stripe account found" }, { status: 404 })
    }

    // Verify Stripe account exists
    const accountResult = await retrieveAccount(vendor.stripe_account_id)
    
    if (!accountResult.success) {
      return NextResponse.json({ error: accountResult.error }, { status: 500 })
    }

    const account = accountResult.account as Stripe.Account

    // Create account link
    const linkResult = await createAccountLink(
      vendor.stripe_account_id, 
      refreshUrl, 
      returnUrl
    )

    if (!linkResult.success) {
      return NextResponse.json({ error: linkResult.error }, { status: 500 })
    }

    return NextResponse.json({
      accountId: vendor.stripe_account_id,
      onboardingLink: linkResult.url
    }, { status: 200 })
  } catch (err) {
    console.error("Unexpected error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
