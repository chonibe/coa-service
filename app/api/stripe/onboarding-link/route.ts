import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { createAccountLink } from "@/lib/stripe"
import { API_BASE_URL } from "@/lib/config"

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

    // Check if vendor has a Stripe account
    if (!vendor.stripe_account_id) {
      return NextResponse.json({ error: "Vendor does not have a Stripe account" }, { status: 400 })
    }

    // Create account link for onboarding
    const refreshUrl = `${API_BASE_URL}/vendor/dashboard/settings?stripe=refresh`
    const returnUrl = `${API_BASE_URL}/vendor/dashboard/settings?stripe=success`

    const result = await createAccountLink(vendor.stripe_account_id, refreshUrl, returnUrl)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      message: "Onboarding link created successfully",
    })
  } catch (error: any) {
    console.error("Error in create onboarding link API:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
