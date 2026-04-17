import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/vendor/series/[id]/archive
 *
 * Soft-archives a series. We flip `is_active` to false (so existing read
 * paths that filter on is_active continue to hide it) and stamp
 * `archived_at` so the Studio Series tab can show "Archived 3w ago" and
 * surface an Unarchive action.
 *
 * Body: { reason?: string } — optional, stored in `archive_reason` if
 * the column exists; safely ignored otherwise so the migration ordering
 * never blocks deploys.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)
    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()

    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    const seriesId = params.id

    // Confirm the series belongs to this vendor before mutating.
    const { data: existing, error: existingError } = await supabase
      .from("artwork_series")
      .select("id, name, is_active, archived_at")
      .eq("id", seriesId)
      .eq("vendor_id", vendor.id)
      .single()

    if (existingError || !existing) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 })
    }

    if (existing.archived_at) {
      return NextResponse.json(
        { series: existing, alreadyArchived: true },
        { status: 200 },
      )
    }

    const nowIso = new Date().toISOString()

    const { data: updated, error: updateError } = await supabase
      .from("artwork_series")
      .update({
        is_active: false,
        archived_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", seriesId)
      .eq("vendor_id", vendor.id)
      .select()
      .single()

    if (updateError) {
      console.error("[Series Archive] Update failed:", updateError)
      return NextResponse.json(
        { error: "Failed to archive series" },
        { status: 500 },
      )
    }

    return NextResponse.json({ series: updated, archived: true })
  } catch (error: any) {
    console.error("[Series Archive] Unexpected error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    )
  }
}
