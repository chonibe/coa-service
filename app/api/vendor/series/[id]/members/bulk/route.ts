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

    const body = await request.json()
    const { submission_ids } = body

    if (!submission_ids || !Array.isArray(submission_ids) || submission_ids.length === 0) {
      return NextResponse.json({ error: "submission_ids array is required and must not be empty" }, { status: 400 })
    }

    // Verify all submissions belong to vendor
    const { data: submissions, error: submissionsError } = await supabase
      .from("vendor_product_submissions")
      .select("id, vendor_id")
      .in("id", submission_ids)

    if (submissionsError) {
      console.error("Error fetching submissions:", submissionsError)
      return NextResponse.json({ error: "Failed to verify submissions" }, { status: 500 })
    }

    if (!submissions || submissions.length !== submission_ids.length) {
      return NextResponse.json({ error: "Some submissions not found" }, { status: 404 })
    }

    const invalidSubmissions = submissions.filter((sub) => sub.vendor_id !== vendor.id)
    if (invalidSubmissions.length > 0) {
      return NextResponse.json({ error: "Some submissions do not belong to vendor" }, { status: 403 })
    }

    // Check for existing members to avoid duplicates
    const { data: existingMembers } = await supabase
      .from("artwork_series_members")
      .select("submission_id")
      .eq("series_id", seriesId)
      .in("submission_id", submission_ids)

    const existingSubmissionIds = new Set(
      (existingMembers || []).map((m) => m.submission_id).filter(Boolean)
    )

    // Filter out submissions that are already in the series
    const newSubmissionIds = submission_ids.filter((id) => !existingSubmissionIds.has(id))

    if (newSubmissionIds.length === 0) {
      return NextResponse.json(
        { 
          message: "All artworks are already in the series",
          added_count: 0,
          skipped_count: submission_ids.length
        },
        { status: 200 }
      )
    }

    // Get the current max display_order
    const { data: maxOrderData } = await supabase
      .from("artwork_series_members")
      .select("display_order")
      .eq("series_id", seriesId)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle()

    const startingDisplayOrder = maxOrderData ? (maxOrderData.display_order || 0) + 1 : 0

    // Prepare bulk insert data
    const membersToInsert = newSubmissionIds.map((submission_id, index) => ({
      series_id: seriesId,
      submission_id,
      shopify_product_id: null,
      is_locked: false,
      unlock_order: null,
      display_order: startingDisplayOrder + index,
    }))

    // Bulk insert
    const { data: insertedMembers, error: insertError } = await supabase
      .from("artwork_series_members")
      .insert(membersToInsert)
      .select()

    if (insertError) {
      console.error("Error bulk inserting members:", insertError)
      return NextResponse.json({ error: "Failed to add artworks to series" }, { status: 500 })
    }

    return NextResponse.json(
      {
        message: `Successfully added ${newSubmissionIds.length} artwork${newSubmissionIds.length !== 1 ? "s" : ""} to series`,
        added_count: newSubmissionIds.length,
        skipped_count: existingSubmissionIds.size,
        members: insertedMembers,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error in POST /api/vendor/series/[id]/members/bulk:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
