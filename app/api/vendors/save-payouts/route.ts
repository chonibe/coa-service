import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { payouts } = body

    if (!payouts || !Array.isArray(payouts) || payouts.length === 0) {
      return NextResponse.json({ message: "Valid payouts array is required" }, { status: 400 })
    }

    console.log(`Saving ${payouts.length} payout settings to Supabase`)

    // Process each payout setting
    const results = await Promise.all(
      payouts.map(async (payout) => {
        try {
          const { product_id, vendor_name, payout_amount, is_percentage } = payout

          if (!product_id || !vendor_name) {
            return {
              status: "error",
              message: "Product ID and vendor name are required",
              payout,
            }
          }

          // Ensure payout_amount is a valid number
          const amount = Number(payout_amount)
          if (isNaN(amount)) {
            return {
              status: "error",
              message: "Payout amount must be a valid number",
              payout,
            }
          }

          // Check if a record already exists
          const { data: existingData, error: checkError } = await supabaseAdmin
            .from("vendor_payouts")
            .select("*")
            .eq("product_id", product_id)
            .eq("vendor_name", vendor_name)
            .maybeSingle()

          if (checkError) {
            console.error("Error checking existing payout:", checkError)
            return {
              status: "error",
              message: checkError.message,
              payout,
            }
          }

          let result
          if (existingData) {
            // Update existing record
            console.log(`Updating existing payout for product ${product_id}`)
            result = await supabaseAdmin
              .from("vendor_payouts")
              .update({
                payout_amount: amount,
                is_percentage: is_percentage === true,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingData.id)
          } else {
            // Insert new record
            console.log(`Creating new payout for product ${product_id}`)
            result = await supabaseAdmin.from("vendor_payouts").insert({
              product_id,
              vendor_name,
              payout_amount: amount,
              is_percentage: is_percentage === true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
          }

          if (result.error) {
            console.error("Error saving payout:", result.error)
            return {
              status: "error",
              message: result.error.message,
              payout,
            }
          }

          return { status: "success", payout }
        } catch (err: any) {
          console.error("Error processing payout:", err)
          return {
            status: "error",
            message: err.message || "Unknown error",
            payout,
          }
        }
      }),
    )

    // Check if any operations failed
    const failures = results.filter((r) => r.status === "error")
    if (failures.length > 0) {
      console.warn(`${failures.length} out of ${payouts.length} payouts failed to save`)
    }

    return NextResponse.json({
      message:
        failures.length > 0
          ? `${payouts.length - failures.length} of ${payouts.length} payouts saved successfully`
          : "All payouts saved successfully",
      results,
    })
  } catch (error: any) {
    console.error("Error in save payouts API:", error)
    return NextResponse.json({ message: error.message || "An error occurred" }, { status: 500 })
  }
}
