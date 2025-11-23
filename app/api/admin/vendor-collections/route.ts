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
    const vendorId = searchParams.get("vendor_id")

    // Build query
    let query = supabase
      .from("vendor_collections")
      .select(
        `
        *,
        vendors:vendor_id (
          id,
          vendor_name,
          contact_email
        )
      `,
      )
      .order("created_at", { ascending: false })

    // Filter by vendor_id if provided
    if (vendorId) {
      query = query.eq("vendor_id", parseInt(vendorId))
    }

    const { data: collections, error } = await query

    if (error) {
      console.error("Error fetching collections:", error)
      return NextResponse.json(
        { error: "Failed to fetch collections", message: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      collections: collections || [],
    })
  } catch (error: any) {
    console.error("Error fetching collections:", error)
    return NextResponse.json(
      { error: "Failed to fetch collections", message: error.message },
      { status: 500 },
    )
  }
}

