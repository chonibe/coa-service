import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get("year") || new Date().getFullYear().toString()
    const vendorName = searchParams.get("vendor")

    // Build the query
    let query = supabaseAdmin
      .from("vendor_payouts")
      .select(
        `
        vendor_name,
        tax_year,
        status,
        payment_method,
        tax_form_generated,
        tax_form_number,
        vendors!inner(tax_id, tax_country, is_company, paypal_email)
      `,
      )
      .eq("tax_year", year)

    // Add vendor filter if provided
    if (vendorName) {
      query = query.eq("vendor_name", vendorName)
    }

    // Execute the query
    const { data: payouts, error } = await query

    if (error) {
      console.error("Error fetching tax reporting data:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get summary data
    const { data: summary, error: summaryError } = await supabaseAdmin.rpc("get_tax_summary", {
      tax_year: Number.parseInt(year as string),
      vendor_filter: vendorName || null,
    })

    if (summaryError) {
      console.error("Error fetching tax summary:", summaryError)
      return NextResponse.json({ error: summaryError.message }, { status: 500 })
    }

    // Get list of available tax years
    const { data: years, error: yearsError } = await supabaseAdmin
      .from("vendor_payouts")
      .select("tax_year")
      .not("tax_year", "is", null)
      .order("tax_year", { ascending: false })
      .distinct()

    if (yearsError) {
      console.error("Error fetching tax years:", yearsError)
      return NextResponse.json({ error: yearsError.message }, { status: 500 })
    }

    // Format the years
    const availableYears = years?.map((y) => y.tax_year) || []

    // Get tax forms for the selected year
    const { data: taxForms, error: taxFormsError } = await supabaseAdmin
      .from("tax_forms")
      .select("*")
      .eq("tax_year", year)
      .order("generated_at", { ascending: false })

    if (taxFormsError) {
      console.error("Error fetching tax forms:", taxFormsError)
      return NextResponse.json({ error: taxFormsError.message }, { status: 500 })
    }

    return NextResponse.json({
      payouts: payouts || [],
      summary: summary || [],
      availableYears,
      taxForms: taxForms || [],
      selectedYear: year,
    })
  } catch (error: any) {
    console.error("Error in tax reporting summary API:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
