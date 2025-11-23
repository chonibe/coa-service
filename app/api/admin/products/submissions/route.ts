import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  try {
    const supabase = createClient()
    const { searchParams } = request.nextUrl
    const status = searchParams.get("status")
    const vendorId = searchParams.get("vendor_id")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from("vendor_product_submissions")
      .select(
        `
        *,
        vendors:vendor_id (
          id,
          vendor_name,
          contact_email,
          status
        )
      `,
        { count: "exact" },
      )
      .order("submitted_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by status if provided
    if (status && ["pending", "approved", "rejected", "published"].includes(status)) {
      query = query.eq("status", status)
    }

    // Filter by vendor_id if provided
    if (vendorId) {
      query = query.eq("vendor_id", parseInt(vendorId))
    }

    const { data: submissions, error, count } = await query

    if (error) {
      console.error("Error fetching submissions:", error)
      return NextResponse.json(
        { error: "Failed to fetch submissions", message: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      submissions: submissions || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error: any) {
    console.error("Error fetching submissions:", error)
    return NextResponse.json(
      { error: "Failed to fetch submissions", message: error.message },
      { status: 500 },
    )
  }
}

