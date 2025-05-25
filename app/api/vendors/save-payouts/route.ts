import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      )
    }

    const { payouts } = await request.json()

    if (!payouts || !Array.isArray(payouts)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    // Validate each payout entry
    for (const payout of payouts) {
      if (!payout.product_id || !payout.vendor_name || typeof payout.payout_amount !== "number" || typeof payout.is_percentage !== "boolean") {
        return NextResponse.json(
          { error: "Invalid payout data" },
          { status: 400 }
        )
      }
    }

    // Upsert payout settings
    const { error } = await supabaseAdmin
      .from("product_vendor_payouts")
      .upsert(
        payouts.map((payout) => ({
          product_id: payout.product_id,
          vendor_name: payout.vendor_name,
          payout_amount: payout.payout_amount,
          is_percentage: payout.is_percentage,
        })),
        { onConflict: "product_id" }
      )

    if (error) {
      console.error("Error saving payout settings:", error)
      return NextResponse.json(
        { error: "Failed to save payout settings" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in save-payouts:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
