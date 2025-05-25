import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      )
    }

    const { productIds, vendorNames } = await request.json()

    if (!productIds || !Array.isArray(productIds) || !vendorNames || !Array.isArray(vendorNames)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    const { data: payouts, error } = await supabaseAdmin
      .from("product_vendor_payouts")
      .select("*")
      .in("product_id", productIds)
      .in("vendor_name", vendorNames)

    if (error) {
      console.error("Error fetching payout settings:", error)
      return NextResponse.json(
        { error: "Failed to fetch payout settings" },
        { status: 500 }
      )
    }

    return NextResponse.json({ payouts })
  } catch (error) {
    console.error("Error in all-payouts:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
