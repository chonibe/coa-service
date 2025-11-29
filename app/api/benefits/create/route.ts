import { NextResponse } from "next/server"
import type { NextRequest } from "next/request"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      product_id,
      series_id,
      hidden_series_id,
      vendor_name,
      benefit_type_id,
      title,
      description,
      content_url,
      access_code,
      starts_at,
      expires_at,
      vip_artwork_id,
      credits_amount,
      drop_date,
      exclusive_visibility_series_id,
    } = body

    // Validate: either product_id OR series_id must be provided (not both)
    if ((!product_id && !series_id) || (product_id && series_id)) {
      return NextResponse.json(
        { error: "Either product_id OR series_id must be provided (not both)" },
        { status: 400 },
      )
    }

    // Validate required fields
    if (!vendor_name || !benefit_type_id || !title) {
      return NextResponse.json(
        { error: "Vendor name, benefit type and title are required" },
        { status: 400 },
      )
    }

    // Create the benefit
    const supabase = createClient()

    const { data, error } = await supabase
      .from("product_benefits")
      .insert({
        product_id: product_id || null,
        series_id: series_id || null,
        hidden_series_id: hidden_series_id || null,
        vendor_name,
        benefit_type_id,
        title,
        description,
        content_url,
        access_code,
        starts_at: starts_at || null,
        expires_at: expires_at || null,
        vip_artwork_id: vip_artwork_id || null,
        credits_amount: credits_amount || null,
        drop_date: drop_date || null,
        exclusive_visibility_series_id: exclusive_visibility_series_id || null,
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
