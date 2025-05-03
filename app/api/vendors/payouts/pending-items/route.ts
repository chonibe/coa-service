import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vendorName } = body

    if (!vendorName) {
      return NextResponse.json({ error: "Vendor name is required" }, { status: 400 })
    }

    // Get pending line items for this vendor
    const { data: lineItems, error } = await supabaseAdmin.rpc("get_vendor_pending_line_items", {
      p_vendor_name: vendorName,
    })

    if (error) {
      console.error("Error fetching pending line items:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      lineItems: lineItems || [],
    })
  } catch (err) {
    console.error("Error in pending line items API:", err)
    return NextResponse.json({ error: "Failed to fetch pending line items" }, { status: 500 })
  }
}
