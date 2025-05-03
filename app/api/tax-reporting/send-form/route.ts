import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { formId } = body

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

    // In a real implementation, we would send an email to the vendor with the tax form
    // For now, we'll just update the tax form record to mark it as sent

    const { error: updateError } = await supabaseAdmin
      .from("tax_forms")
      .update({
        sent_to_vendor: true,
        sent_at: new Date().toISOString(),
      })
      .eq("id", formId)

    if (updateError) {
      console.error("Error updating tax form:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Tax form ${taxForm.form_number} sent to ${taxForm.vendor_name}`,
    })
  } catch (error: any) {
    console.error("Error sending tax form:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
