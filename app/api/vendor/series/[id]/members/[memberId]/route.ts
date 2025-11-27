import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
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
    const memberId = params.memberId

    // Verify series belongs to vendor
    const { data: series, error: seriesError } = await supabase
      .from("artwork_series")
      .select("id")
      .eq("id", seriesId)
      .eq("vendor_id", vendor.id)
      .single()

    if (seriesError || !series) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 })
    }

    // Verify member belongs to series
    const { data: existingMember, error: memberError } = await supabase
      .from("artwork_series_members")
      .select("id")
      .eq("id", memberId)
      .eq("series_id", seriesId)
      .single()

    if (memberError || !existingMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    const body = await request.json()
    const updateData: any = {}

    if (body.is_locked !== undefined) updateData.is_locked = body.is_locked
    if (body.unlock_order !== undefined) updateData.unlock_order = body.unlock_order || null
    if (body.display_order !== undefined) updateData.display_order = body.display_order
    if (body.unlocked_at !== undefined) updateData.unlocked_at = body.unlocked_at || null

    const { data: updatedMember, error: updateError } = await supabase
      .from("artwork_series_members")
      .update(updateData)
      .eq("id", memberId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating member:", updateError)
      return NextResponse.json({ error: "Failed to update member" }, { status: 500 })
    }

    return NextResponse.json({ member: updatedMember })
  } catch (error: any) {
    console.error("Error in PUT /api/vendor/series/[id]/members/[memberId]:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
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
    const memberId = params.memberId

    // Verify series belongs to vendor
    const { data: series, error: seriesError } = await supabase
      .from("artwork_series")
      .select("id")
      .eq("id", seriesId)
      .eq("vendor_id", vendor.id)
      .single()

    if (seriesError || !series) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 })
    }

    // Verify member belongs to series
    const { data: existingMember, error: memberError } = await supabase
      .from("artwork_series_members")
      .select("id")
      .eq("id", memberId)
      .eq("series_id", seriesId)
      .single()

    if (memberError || !existingMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Delete member
    const { error: deleteError } = await supabase
      .from("artwork_series_members")
      .delete()
      .eq("id", memberId)

    if (deleteError) {
      console.error("Error deleting member:", deleteError)
      return NextResponse.json({ error: "Failed to delete member" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in DELETE /api/vendor/series/[id]/members/[memberId]:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

