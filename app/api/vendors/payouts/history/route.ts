import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  const supabase = createClient()

  try {
    const { searchParams } = request.nextUrl
    const vendorName = searchParams.get("vendorName")
    const limit = parseInt(searchParams.get("limit") || "200")

    // Build query with optional vendor filter
    let query = supabase
      .from("vendor_payouts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(Math.min(limit, 500)) // Cap at 500

    if (vendorName) {
      query = query.eq("vendor_name", vendorName)
    }

    const { data: payouts, error } = await query

    if (error) {
      console.error("Error fetching payout history:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ payouts: payouts || [] })
  } catch (error: any) {
    console.error("Error in payout history API:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
