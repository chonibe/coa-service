import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin } from "/dev/null"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { year, vendorNames, formType } = body

    if (!year || !Array.isArray(vendorNames) || vendorNames.length === 0) {
      return NextResponse.json({ error: "Year and vendor names are required" }, { status: 400 })
    }

    const results = []
    let successCount = 0

    for (const vendorName of vendorNames) {
      try {
        // Get vendor information
        const { data: vendor, error: vendorError } = await supabaseAdmin
          .from("vendors")
          .select("*")
          .eq("vendor_name", vendorName)
          .single()

        if (vendorError) {
          console.error(`Error fetching vendor ${vendorName}:`, vendorError)
          results.push({
            vendorName,
            success: false,
            error: vendorError.message,
          })
          continue
        }

        // Get all payouts for this vendor in the specified year
        const { data: payouts, error: payoutsError } = await supabaseAdmin
          .from("vendor_payouts")
          .select("*")
          .eq("vendor_name", vendorName)
          .eq("tax_year", year)
          .eq("status", "completed")

        if (payoutsError) {
          console.error(`Error fetching payouts for ${vendorName}:`, payoutsError)
          results.push({
            vendorName,
            success: false,
            error: payoutsError.message,
          })
          continue
        }

        if (!payouts || payouts.length === 0) {
          results.push({
            vendorName,
            success: false,
            error: "No completed payouts found for this year",
          })
          continue
        }

        // Calculate total amount
        const totalAmount = payouts.reduce((sum, payout) => sum + Number.parseFloat(payout.amount), 0)

        // Generate a unique form number
        const formNumber = `${formType}-${year}-${vendorName.substring(0, 3).toUpperCase()}-${crypto
          .randomBytes(4)
          .toString("hex")
          .toUpperCase()}`

        // Create tax form record
        const { data: taxForm, error: taxFormError } = await supabaseAdmin
          .from("tax_forms")
          .insert({
            vendor_name: vendorName,
            tax_year: Number.parseInt(year),
            form_type: formType,
            form_number: formNumber,
            total_amount: totalAmount,
            generated_at: new Date().toISOString(),
            form_data: {
              vendor: vendor,
              payouts: payouts,
              totalAmount: totalAmount,
            },
            status: "generated",
          })
          .select()
          .single()

        if (taxFormError) {
          console.error(`Error creating tax form for ${vendorName}:`, taxFormError)
          results.push({
            vendorName,
            success: false,
            error: taxFormError.message,
          })
          continue
        }

        // Update all payouts to mark them as having tax forms generated
        const { error: updateError } = await supabaseAdmin
          .from("vendor_payouts")
          .update({
            tax_form_generated: true,
            tax_form_number: formNumber,
          })
          .eq("vendor_name", vendorName)
          .eq("tax_year", year)
          .eq("status", "completed")

        if (updateError) {
          console.error(`Error updating payouts for ${vendorName}:`, updateError)
          // Don't fail the whole operation, just log the error
        }

        results.push({
          vendorName,
          success: true,
          formNumber,
          formId: taxForm.id,
        })

        successCount++
      } catch (err: any) {
        console.error(`Error processing tax form for ${vendorName}:`, err)
        results.push({
          vendorName,
          success: false,
          error: err.message || "Unknown error",
        })
      }
    }

    return NextResponse.json({
      success: true,
      generated: successCount,
      total: vendorNames.length,
      results,
    })
  } catch (error: any) {
    console.error("Error in generate tax forms API:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
