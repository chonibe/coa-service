import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ message: "Database connection error" }, { status: 500 })
    }

    const body = await request.json()
    const { vendor_name, instagram_url, notes, paypal_email, tax_id, tax_country, is_company, signature_url } = body

    if (!vendor_name) {
      return NextResponse.json({ message: "Vendor name is required" }, { status: 400 })
    }

    // Check if the vendor exists
    const { data: existingVendor, error: checkError } = await supabase
      .from("vendors")
      .select("*")
      .eq("vendor_name", vendor_name)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking vendor:", checkError)
      return NextResponse.json({ message: checkError.message }, { status: 500 })
    }

    const now = new Date().toISOString()

    if (existingVendor) {
      // Update existing vendor
      const { error: updateError } = await supabase
        .from("vendors")
        .update({
          instagram_url,
          notes,
          paypal_email,
          tax_id,
          tax_country,
          is_company,
          signature_url,
          updated_at: now,
        })
        .eq("vendor_name", vendor_name)

      if (updateError) {
        console.error("Error updating vendor:", updateError)
        return NextResponse.json({ message: updateError.message }, { status: 500 })
      }
    } else {
      // Insert new vendor
      const { error: insertError } = await supabase.from("vendors").insert({
        vendor_name,
        instagram_url,
        notes,
        paypal_email,
        tax_id,
        tax_country,
        is_company,
        signature_url,
        created_at: now,
        updated_at: now,
      })

      if (insertError) {
        console.error("Error inserting vendor:", insertError)
        return NextResponse.json({ message: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in vendor custom data API:", error)
    return NextResponse.json({ message: error.message || "An error occurred" }, { status: 500 })
  }
}
