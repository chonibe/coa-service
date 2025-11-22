import { NextResponse } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/admin/vendors
 * Get all vendors
 */
export async function GET() {
  try {
    await guardAdminRequest()

    const supabase = createClient()
    const { data: vendors, error } = await supabase
      .from("vendors")
      .select("vendor_name")
      .order("vendor_name")

    if (error) {
      console.error("Error fetching vendors:", error)
      return NextResponse.json(
        { error: "Failed to fetch vendors", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ vendors: vendors || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 })
  }
}

