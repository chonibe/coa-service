import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const formId = params.id

    if (!formId) {
      return NextResponse.json({ error: "Form ID is required" }, { status: 400 })
    }

    // Get the tax form
    const { data: taxForm, error } = await supabaseAdmin.from("tax_forms").select("*").eq("id", formId).single()

    if (error) {
      console.error("Error fetching tax form:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!taxForm) {
      return NextResponse.json({ error: "Tax form not found" }, { status: 404 })
    }

    // Get vendor information
    const { data: vendor, error: vendorError } = await supabaseAdmin
      .from("vendors")
      .select("*")
      .eq("vendor_name", taxForm.vendor_name)
      .single()

    if (vendorError) {
      console.error("Error fetching vendor:", vendorError)
      return NextResponse.json({ error: vendorError.message }, { status: 500 })
    }

    // In a real implementation, we would generate a PDF here
    // For now, we'll just return the tax form data as JSON

    return NextResponse.json({
      taxForm,
      vendor,
      // This would be a URL to the generated PDF in a real implementation
      pdfUrl: `/api/tax-reporting/pdf/${formId}`,
    })
  } catch (error: any) {
    console.error("Error downloading tax form:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
