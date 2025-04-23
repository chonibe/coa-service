import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { payouts } = body

    if (!payouts || !Array.isArray(payouts) || payouts.length === 0) {
      return NextResponse.json({ message: "Payouts data is required" }, { status: 400 })
    }

    // Process each payout setting
    for (const payout of payouts) {
      const { product_id, vendor_name, payout_amount, is_percentage } = payout

      if (!product_id || !vendor_name) {
        continue // Skip invalid entries
      }

      // Check if this payout setting already exists
      const { data: existingPayout, error: checkError } = await supabaseAdmin
        .from("vendor_payouts")
        .select("id")
        .eq("product_id", product_id)
        .eq("vendor_name", vendor_name)
        .maybeSingle()

      if (checkError) {
        console.error("Error checking if payout exists:", checkError)
        continue
      }

      const now = new Date().toISOString()

      if (existingPayout) {
        // Update existing payout
        const { error } = await supabaseAdmin
          .from("vendor_payouts")
          .update({
            payout_amount,
            is_percentage,
            updated_at: now,
          })
          .eq("product_id", product_id)
          .eq("vendor_name", vendor_name)

        if (error) {
          console.error("Error updating payout:", error)
        }
      } else {
        // Insert new payout
        const { error } = await supabaseAdmin.from("vendor_payouts").insert({
          product_id,
          vendor_name,
          payout_amount,
          is_percentage,
          created_at: now,
          updated_at: now,
        })

        if (error) {
          console.error("Error inserting payout:", error)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in save payouts API:", error)
    return NextResponse.json({ message: error.message || "An error occurred" }, { status: 500 })
  }
}
