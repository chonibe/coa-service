import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productIds } = body

    if (!productIds || !productIds.length) {
      return NextResponse.json({ message: "Product IDs are required" }, { status: 400 })
    }

    // Fetch all payout settings
    const { data, error } = await supabaseAdmin.from("product_vendor_payouts").select("*").in("product_id", productIds)

    if (error) {
      console.error("Error fetching vendor payouts:", error)
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    return NextResponse.json({ payouts: data || [] })
  } catch (error: any) {
    console.error("Error in vendor payouts API:", error)
    return NextResponse.json({ message: error.message || "An error occurred" }, { status: 500 })
  }
}
