import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()

    // Get vendor info
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, vendor_name")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    const seriesId = params.id
    const body = await request.json()
    const { newName } = body

    if (!newName || !newName.trim()) {
      return NextResponse.json({ error: "New series name is required" }, { status: 400 })
    }

    // Fetch original series
    const { data: originalSeries, error: seriesError } = await supabase
      .from("artwork_series")
      .select("*")
      .eq("id", seriesId)
      .eq("vendor_id", vendor.id)
      .single()

    if (seriesError || !originalSeries) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 })
    }

    // Check for duplicate name
    const { data: existing } = await supabase
      .from("artwork_series")
      .select("id")
      .eq("vendor_id", vendor.id)
      .eq("name", newName.trim())
      .eq("is_active", true)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "A series with this name already exists" }, { status: 400 })
    }

    // Create new series
    const { data: newSeries, error: createError } = await supabase
      .from("artwork_series")
      .insert({
        vendor_id: vendor.id,
        vendor_name: vendor.vendor_name,
        name: newName.trim(),
        description: originalSeries.description,
        thumbnail_url: originalSeries.thumbnail_url,
        unlock_type: originalSeries.unlock_type,
        unlock_config: originalSeries.unlock_config,
        display_order: originalSeries.display_order,
        is_active: true,
      })
      .select()
      .single()

    if (createError) {
      console.error("Error creating duplicate series:", createError)
      return NextResponse.json({ error: "Failed to duplicate series" }, { status: 500 })
    }

    // Fetch original members
    const { data: originalMembers, error: membersError } = await supabase
      .from("artwork_series_members")
      .select("*")
      .eq("series_id", seriesId)

    if (membersError) {
      console.error("Error fetching original members:", membersError)
    }

    // Duplicate members if they exist
    if (originalMembers && originalMembers.length > 0) {
      const newMembers = originalMembers.map((member) => ({
        series_id: newSeries.id,
        submission_id: member.submission_id,
        shopify_product_id: member.shopify_product_id,
        is_locked: member.is_locked,
        unlock_order: member.unlock_order,
        display_order: member.display_order,
      }))

      const { error: insertMembersError } = await supabase
        .from("artwork_series_members")
        .insert(newMembers)

      if (insertMembersError) {
        console.error("Error duplicating members:", insertMembersError)
        // Continue even if members fail to duplicate
      }
    }

    return NextResponse.json({ series: newSeries }, { status: 201 })
  } catch (error: any) {
    console.error("Error in POST /api/vendor/series/[id]/duplicate:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

