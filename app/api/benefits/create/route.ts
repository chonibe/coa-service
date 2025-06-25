import { NextResponse } from "next/server"
import type { NextRequest } from "next/request"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      product_id,
      vendor_name,
      benefit_type_id,
      title,
      description,
      content_url,
      access_code,
      starts_at,
      expires_at,
    } = body

    // Validate required fields
    if (!product_id || !vendor_name || !benefit_type_id || !title) {
      return NextResponse.json(
        { error: "Product ID, vendor name, benefit type and title are required" },
        { status: 400 },
      )
    }

    // Create the benefit
    const supabase = createClient()

    const { data, error } = await supabase
      .from("product_benefits")
      .insert({
        product_id,
        vendor_name,
        benefit_type_id,
        title,
        description,
        content_url,
        access_code,
        starts_at: starts_at || null,
        expires_at: expires_at || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, benefit: data[0] })
  } catch (error: any) {
    console.error("Error creating benefit:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
