import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
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

    // Fetch active series for dropdown
    const { data: series, error: seriesError } = await supabase
      .from("artwork_series")
      .select("id, name")
      .eq("vendor_id", vendor.id)
      .eq("is_active", true)
      .order("name", { ascending: true })

    if (seriesError) {
      console.error("Error fetching available series:", seriesError)
      return NextResponse.json({ error: "Failed to fetch series" }, { status: 500 })
    }

    // Get member count for each series
    const seriesWithCounts = await Promise.all(
      (series || []).map(async (s) => {
        const { count } = await supabase
          .from("artwork_series_members")
          .select("*", { count: "exact", head: true })
          .eq("series_id", s.id)

        return {
          id: s.id,
          name: s.name,
          member_count: count || 0,
        }
      })
    )

    return NextResponse.json({ series: seriesWithCounts })
  } catch (error: any) {
    console.error("Error in GET /api/vendor/series/available:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

