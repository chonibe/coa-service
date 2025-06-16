import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"
import { retrieveAccount } from "@/lib/stripe"
import type Stripe from "stripe"

export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase admin client initialization failed" }, { status: 500 })
  }

  try {
    const { data: vendor, error: vendorError } = await supabaseAdmin
      .from("vendors")
      .select("stripe_account_id")
      .eq("vendor_name", "ADMIN")
      .single()

    if (vendorError) {
      console.error("Vendor fetch error:", vendorError)
      return NextResponse.json({ error: vendorError.message }, { status: 400 })
    }

    if (!vendor || !vendor.stripe_account_id) {
      return NextResponse.json({ error: "No Stripe account found" }, { status: 404 })
    }

    const result = await retrieveAccount(vendor.stripe_account_id)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    const account = result.account as Stripe.Account
    const requirementStatus = account.requirements?.currently_due?.length ? "incomplete" : "complete"
    const detailsSubmitted = account.details_submitted ?? false
    const chargesEnabled = account.charges_enabled ?? false

    return NextResponse.json({
      accountId: account.id,
      requirementStatus,
      detailsSubmitted,
      chargesEnabled,
      requirements: account.requirements?.currently_due ?? []
    }, { status: 200 })
  } catch (err) {
    console.error("Unexpected error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
