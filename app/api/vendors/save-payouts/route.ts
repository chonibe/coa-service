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

    console.log("Saving payouts:", payouts)

    // Process each payout setting
    const results = []
    for (const payout of payouts) {
      const { product_id, vendor_name, payout_amount, is_percentage } = payout

      if (!product_id || !vendor_name) {
        results.push({ product_id, status: "skipped", reason: "Missing product_id or vendor_name" })
        continue // Skip invalid entries
      }

      // Ensure payout_amount is a valid number
      const amount = typeof payout_amount === "string" ? Number.parseFloat(payout_amount) : Number(payout_amount)

      if (isNaN(amount)) {
        results.push({ product_id, status: "error", reason: "Invalid payout amount" })
        continue
      }

      // Check if this payout setting already exists
      const { data: existingPayout, error: checkError } = await supabaseAdmin
        .from("product_vendor_payouts")
        .select("id")
        .eq("product_id", product_id)
        .eq("vendor_name", vendor_name)
        .maybeSingle()

      if (checkError) {
        console.error("Error checking if payout exists:", checkError)
        results.push({
          product_id,
          status: "error",
          reason: `Error checking if payout exists: ${checkError.message}`,
        })
        continue
      }

      const now = new Date().toISOString()

      if (existingPayout) {
        // Update existing payout
        const { error } = await supabaseAdmin
          .from("product_vendor_payouts")
          .update({
            payout_amount: amount,
            is_percentage,
            updated_at: now,
          })
          .eq("id", existingPayout.id)

        if (error) {
          console.error("Error updating payout:", error)
          results.push({
            product_id,
            status: "error",
            reason: `Error updating payout: ${error.message}`,
          })
        } else {
          results.push({ product_id, status: "updated" })
        }
      } else {
        // Insert new payout
        const { error } = await supabaseAdmin.from("product_vendor_payouts").insert({
          product_id,
          vendor_name,
          payout_amount: amount,
          is_percentage,
          created_at: now,
          updated_at: now,
        })

        if (error) {
          console.error("Error inserting payout:", error)
          results.push({
            product_id,
            status: "error",
            reason: `Error inserting payout: ${error.message}`,
          })
        } else {
          results.push({ product_id, status: "inserted" })
        }
      }
    }

    // Check if any operations failed
    const failures = results.filter((r) => r.status === "error")
    if (failures.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Some payouts failed to save",
          results,
        },
        { status: 207 },
      ) // 207 Multi-Status
    }

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    console.error("Error in save payouts API:", error)
    return NextResponse.json({ message: error.message || "An error occurred" }, { status: 500 })
  }
}
