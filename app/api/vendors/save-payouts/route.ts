import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  const supabase = createClient()
  
  try {
    const body = await request.json()
    const { payouts } = body

    if (!payouts || !Array.isArray(payouts) || payouts.length === 0) {
      return NextResponse.json({ message: "Valid payouts array is required" }, { status: 400 })
    }

    console.log(`Saving ${payouts.length} payout settings to Supabase:`, JSON.stringify(payouts))

    // Process each payout setting
    const results = []
    for (const payout of payouts) {
      try {
        const { product_id, vendor_name, payout_amount, is_percentage } = payout

        if (!product_id || !vendor_name) {
          results.push({
            status: "error",
            message: "Product ID and vendor name are required",
            payout,
          })
          continue
        }

        // Ensure payout_amount is a valid number
        const amount = Number(payout_amount)
        if (isNaN(amount)) {
          results.push({
            status: "error",
            message: "Payout amount must be a valid number",
            payout,
          })
          continue
        }

        // Check if a record already exists
        const { data: existingData, error: checkError } = await supabase
          .from("product_vendor_payouts")
          .select("*")
          .eq("product_id", product_id)
          .eq("vendor_name", vendor_name)
          .maybeSingle()

        if (checkError) {
          console.error("Error checking existing payout:", checkError)
          results.push({
            status: "error",
            message: checkError.message,
            payout,
          })
          continue
        }

        const now = new Date().toISOString()
        let result

        if (existingData) {
          // Update existing record
          console.log(`Updating existing payout for product ${product_id} with amount ${amount}`)
          result = await supabase
            .from("product_vendor_payouts")
            .update({
              payout_amount: amount,
              is_percentage: is_percentage === true,
              updated_at: now,
            })
            .eq("id", existingData.id)
        } else {
          // Insert new record
          console.log(`Creating new payout for product ${product_id} with amount ${amount}`)
          result = await supabase.from("product_vendor_payouts").insert({
            product_id,
            vendor_name,
            payout_amount: amount,
            is_percentage: is_percentage === true,
            created_at: now,
            updated_at: now,
          })
        }

        if (result.error) {
          console.error("Error saving payout:", result.error)
          results.push({
            status: "error",
            message: result.error.message,
            payout,
          })
        } else {
          results.push({
            status: "success",
            message: existingData ? "Updated" : "Created",
            payout,
          })
        }
      } catch (err: any) {
        console.error("Error processing payout:", err)
        results.push({
          status: "error",
          message: err.message || "Unknown error",
          payout,
        })
      }
    }

    // Check if any operations failed
    const failures = results.filter((r) => r.status === "error")
    if (failures.length > 0) {
      console.warn(`${failures.length} out of ${payouts.length} payouts failed to save`)
      return NextResponse.json(
        {
          success: false,
          message: `${payouts.length - failures.length} of ${payouts.length} payouts saved successfully`,
          results,
        },
        { status: 207 },
      ) // 207 Multi-Status
    }

    return NextResponse.json({
      success: true,
      message: "All payouts saved successfully",
      results,
    })
  } catch (error: any) {
    console.error("Error in save payouts API:", error)
    return NextResponse.json({ message: error.message || "An error occurred" }, { status: 500 })
  }
}
