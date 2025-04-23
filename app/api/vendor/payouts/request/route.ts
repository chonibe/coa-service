import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { amount, paypal_email } = await request.json()

    // Validate the request
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount requested" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Verify the vendor is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const vendorId = session.user.id

    // Get vendor's available balance
    const { data: vendor } = await supabase
      .from("vendors")
      .select("accumulated_sales, paid_amount")
      .eq("id", vendorId)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    const availableBalance = vendor.accumulated_sales - vendor.paid_amount

    if (amount > availableBalance) {
      return NextResponse.json({ error: "Requested amount exceeds available balance" }, { status: 400 })
    }

    // Create payout request
    const { data: payout, error } = await supabase
      .from("vendor_payouts")
      .insert({
        vendor_id: vendorId,
        amount: amount,
        status: "pending",
        paypal_email: paypal_email,
        requested_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating payout request:", error)
      return NextResponse.json({ error: "Failed to create payout request" }, { status: 500 })
    }

    return NextResponse.json({ payout })
  } catch (error) {
    console.error("Error in payout request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
