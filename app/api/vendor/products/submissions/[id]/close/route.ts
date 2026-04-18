import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/vendor/products/submissions/[id]/close
 * Artist marks a live listing as closed (e.g. sold work cannot be deleted — use this instead).
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
      .maybeSingle()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    const { data: submission, error: fetchError } = await supabase
      .from("vendor_product_submissions")
      .select("id, status, vendor_id")
      .eq("id", params.id)
      .eq("vendor_id", vendor.id)
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json({ error: "Database error", message: fetchError.message }, { status: 500 })
    }
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    if (submission.status === "closed") {
      return NextResponse.json({ error: "Already closed", message: "This listing is already marked closed." }, { status: 400 })
    }

    if (submission.status !== "published" && submission.status !== "approved") {
      return NextResponse.json(
        {
          error: "Cannot close",
          message: "Only published or approved artworks can be closed by the artist.",
        },
        { status: 400 },
      )
    }

    const { data: updated, error: updateError } = await supabase
      .from("vendor_product_submissions")
      .update({
        status: "closed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .eq("vendor_id", vendor.id)
      .select()
      .maybeSingle()

    if (updateError) {
      return NextResponse.json({ error: "Failed to close listing", message: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, submission: updated })
  } catch (error: any) {
    console.error("[close listing]", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
