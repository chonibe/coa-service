import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get("year") || new Date().getFullYear().toString()

    const supabase = createClient()

    // Get tax summary for the specified year
    const { data: summary, error: summaryError } = await supabase.rpc("get_vendor_tax_summary", {
      tax_year: Number.parseInt(year),
    })

    if (summaryError) {
      console.error("Error fetching tax summary:", summaryError)
      return NextResponse.json({ error: summaryError.message }, { status: 500 })
    }

    // Get all available years with payout data
    const { data: yearsData, error: yearsError } = await supabase
      .from("vendor_payouts")
      .select("payout_date")
      .order("payout_date", { ascending: false })

    if (yearsError) {
      console.error("Error fetching available years:", yearsError)
      return NextResponse.json({ error: yearsError.message }, { status: 500 })
    }

    // Extract unique years from payout dates
    const availableYears = Array.from(
      new Set(yearsData.filter((item) => item.payout_date).map((item) => new Date(item.payout_date).getFullYear())),
    ).sort((a, b) => b - a) // Sort descending

    // Get generated tax forms for the specified year
    const { data: taxForms, error: formsError } = await supabase
      .from("vendor_tax_forms")
      .select("*")
      .eq("tax_year", year)
      .order("generated_at", { ascending: false })

    if (formsError) {
      console.error("Error fetching tax forms:", formsError)
      return NextResponse.json({ error: formsError.message }, { status: 500 })
    }

    // If no available years from data, include current year
    if (availableYears.length === 0) {
      availableYears.push(new Date().getFullYear())
    }

    return NextResponse.json({
      summary: summary || [],
      availableYears,
      taxForms: taxForms || [],
    })
  } catch (err) {
    console.error("Error in tax reporting summary API:", err)
    return NextResponse.json({ error: "Failed to fetch tax reporting data" }, { status: 500 })
  }
}
