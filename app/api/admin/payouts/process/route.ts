import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { payoutId, action, notes } = await request.json()

    if (!payoutId || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Verify admin is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // TODO: Add admin role check here

    // Get the payout request
    const { data: payout } = await supabase
      .from("vendor_payouts")
      .select("*, vendors(accumulated_sales, paid_amount)")
      .eq("id", payoutId)
      .single()

    if (!payout) {
      return NextResponse.json({ error: "Payout request not found" }, { status: 404 })
    }

    if (payout.status !== "pending") {
      return NextResponse.json({ error: "This payout request has already been processed" }, { status: 400 })
    }

    // Process based on action
    if (action === "approve") {
      // Update payout status
      const { error: updateError } = await supabase
        .from("vendor_payouts")
        .update({
          status: "approved",
          processed_at: new Date().toISOString(),
          processed_by: session.user.id,
          admin_notes: notes || null,
        })
        .eq("id", payoutId)

      if (updateError) {
        console.error("Error updating payout status:", updateError)
        return NextResponse.json({ error: "Failed to update payout status" }, { status: 500 })
      }

      // Update vendor's paid amount
      const { error: vendorUpdateError } = await supabase
        .from("vendors")
        .update({
          paid_amount: payout.vendors.paid_amount + payout.amount,
        })
        .eq("id", payout.vendor_id)

      if (vendorUpdateError) {
        console.error("Error updating vendor paid amount:", vendorUpdateError)
        return NextResponse.json({ error: "Failed to update vendor paid amount" }, { status: 500 })
      }

      // TODO: Integrate with PayPal or other payment processor to send the payment

      return NextResponse.json({
        success: true,
        message: "Payout approved successfully",
      })
    } else {
      // Reject the payout
      const { error: updateError } = await supabase
        .from("vendor_payouts")
        .update({
          status: "rejected",
          processed_at: new Date().toISOString(),
          processed_by: session.user.id,
          admin_notes: notes || null,
        })
        .eq("id", payoutId)

      if (updateError) {
        console.error("Error updating payout status:", updateError)
        return NextResponse.json({ error: "Failed to update payout status" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "Payout rejected successfully",
      })
    }
  } catch (error) {
    console.error("Error in process payout:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
