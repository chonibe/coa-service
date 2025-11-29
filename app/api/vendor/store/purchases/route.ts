import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const cookieStore = cookies()
  const vendorName = getVendorFromCookieStore(cookieStore)

  if (!vendorName) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    // Get vendor info
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, vendor_name")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Get all purchases for this vendor
    const { data: purchases, error: purchasesError } = await supabase
      .from("vendor_store_purchases")
      .select("*")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false })

    if (purchasesError) {
      console.error("Error fetching purchases:", purchasesError)
      return NextResponse.json(
        { error: "Failed to fetch purchases", message: purchasesError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      purchases: purchases || [],
    })
  } catch (error: any) {
    console.error("Error fetching purchases:", error)
    return NextResponse.json(
      { error: "Failed to fetch purchases", message: error.message },
      { status: 500 }
    )
  }
}

