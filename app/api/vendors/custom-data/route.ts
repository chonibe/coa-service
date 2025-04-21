import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Get custom data for a vendor
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const vendorName = searchParams.get("name")

    if (!vendorName) {
      return NextResponse.json({ error: "Vendor name is required" }, { status: 400 })
    }

    const { data, error } = await supabase.from("vendors").select("*").eq("vendor_name", vendorName).single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned" which is fine - we'll just return null
      console.error("Error fetching vendor custom data:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || null })
  } catch (error) {
    console.error("Unexpected error in vendor custom data API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}

// Update custom data for a vendor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vendorName, instagramUrl, notes } = body

    if (!vendorName) {
      return NextResponse.json({ error: "Vendor name is required" }, { status: 400 })
    }

    // Check if vendor already exists
    const { data: existingVendor } = await supabase.from("vendors").select("id").eq("vendor_name", vendorName).single()

    const now = new Date().toISOString()

    if (existingVendor) {
      // Update existing vendor
      const { data, error } = await supabase
        .from("vendors")
        .update({
          instagram_url: instagramUrl,
          notes: notes,
          updated_at: now,
        })
        .eq("vendor_name", vendorName)
        .select()

      if (error) {
        console.error("Error updating vendor:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data, success: true })
    } else {
      // Insert new vendor
      const { data, error } = await supabase
        .from("vendors")
        .insert({
          vendor_name: vendorName,
          instagram_url: instagramUrl,
          notes: notes,
          updated_at: now,
        })
        .select()

      if (error) {
        console.error("Error inserting vendor:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data, success: true })
    }
  } catch (error) {
    console.error("Unexpected error in vendor update API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
