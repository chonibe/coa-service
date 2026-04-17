import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/vendor/series/[id]/unarchive
 *
 * Reverses an archive: clears `archived_at` and flips `is_active` back
 * on. We re-check the unique-name constraint since the archived series
 * may collide with one the artist created in the meantime.
 */
export async function POST(
  _request: NextRequest,
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

    const { data: existing, error: existingError } = await supabase
      .from("artwork_series")
      .select("id, name, is_active, archived_at")
      .eq("id", seriesId)
      .eq("vendor_id", vendor.id)
      .single()

    if (existingError || !existing) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 })
    }

    if (!existing.archived_at && existing.is_active) {
      return NextResponse.json(
        { series: existing, alreadyActive: true },
        { status: 200 },
      )
    }

    // Guard against unique(vendor_id, name) collisions if the artist
    // created a fresh series with the same name while this one was
    // archived.
    const { data: collision } = await supabase
      .from("artwork_series")
      .select("id")
      .eq("vendor_id", vendor.id)
      .eq("name", existing.name)
      .eq("is_active", true)
      .neq("id", seriesId)
      .maybeSingle()

    if (collision) {
      return NextResponse.json(
        {
          error: "An active series already uses this name. Rename or archive it before restoring.",
        },
        { status: 409 },
      )
    }

    const nowIso = new Date().toISOString()

    const { data: updated, error: updateError } = await supabase
      .from("artwork_series")
      .update({
        is_active: true,
        archived_at: null,
        updated_at: nowIso,
      })
      .eq("id", seriesId)
      .eq("vendor_id", vendor.id)
      .select()
      .single()

    if (updateError) {
      console.error("[Series Unarchive] Update failed:", updateError)
      return NextResponse.json(
        { error: "Failed to restore series" },
        { status: 500 },
      )
    }

    return NextResponse.json({ series: updated, restored: true })
  } catch (error: any) {
    console.error("[Series Unarchive] Unexpected error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    )
  }
}
